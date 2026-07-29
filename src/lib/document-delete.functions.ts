import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({ uploadId: z.string().uuid() });

/**
 * Deletes a visitor's own upload (row + stored file).
 * Ids are unguessable UUIDs known only to the uploader's session.
 * Runs with the service key so the bucket can stay fully private.
 */
export const deleteDocumentUpload = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.DOCUMENT_SERVICE_ROLE_KEY;
    if (!serviceKey) throw new Error("Deleting is not configured yet (missing service key).");

    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(process.env.SUPABASE_URL!, serviceKey, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

    const { data: row, error: selErr } = await admin
      .from("document_uploads")
      .select("storage_path")
      .eq("id", data.uploadId)
      .maybeSingle();
    if (selErr) throw new Error("Could not find that document.");

    if (row?.storage_path) {
      const { error: rmErr } = await admin.storage
        .from("document-uploads")
        .remove([row.storage_path]);
      if (rmErr) throw new Error("Could not delete the stored file.");
    }

    const { error: delErr } = await admin
      .from("document_uploads")
      .delete()
      .eq("id", data.uploadId);
    if (delErr) throw new Error("Could not delete the document record.");

    return { ok: true };
  });
