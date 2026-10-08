export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileNode[];
  size_bytes?: number;
  modified_at?: number;
}
