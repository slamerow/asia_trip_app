import { describe, expect, it, vi } from "vitest";
import { deletePhotoSafely } from "./photo-delete";

describe("deletePhotoSafely", () => {
  it("deletes the gallery record before the storage file", async () => {
    const calls: string[] = [];
    const result = await deletePhotoSafely({
      deleteFile: async () => {
        calls.push("file");
        return true;
      },
      deleteRecord: async () => {
        calls.push("record");
        return true;
      },
    });

    expect(calls).toEqual(["record", "file"]);
    expect(result.status).toBe("deleted");
  });

  it("does not delete the file when the gallery record cannot be removed", async () => {
    const deleteFile = vi.fn(async () => true);
    const result = await deletePhotoSafely({
      deleteFile,
      deleteRecord: async () => false,
    });

    expect(deleteFile).not.toHaveBeenCalled();
    expect(result.status).toBe("record_delete_failed");
  });

  it("reports an orphaned file without restoring a broken gallery record", async () => {
    const result = await deletePhotoSafely({
      deleteFile: async () => false,
      deleteRecord: async () => true,
    });

    expect(result.status).toBe("deleted_with_orphaned_file");
  });
});
