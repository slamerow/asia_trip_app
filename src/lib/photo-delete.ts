export type PhotoDeletionResult =
  | { status: "deleted" }
  | { status: "deleted_with_orphaned_file" }
  | { status: "record_delete_failed" };

export async function deletePhotoSafely({
  deleteFile,
  deleteRecord,
}: {
  deleteFile: () => Promise<boolean>;
  deleteRecord: () => Promise<boolean>;
}): Promise<PhotoDeletionResult> {
  const recordDeleted = await deleteRecord();

  if (!recordDeleted) return { status: "record_delete_failed" };

  const fileDeleted = await deleteFile();
  return fileDeleted ? { status: "deleted" } : { status: "deleted_with_orphaned_file" };
}
