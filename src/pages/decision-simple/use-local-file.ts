import React, { useState } from 'react';
import { toast } from 'sonner';
import type { DecisionGraphType } from '@republicroad/jdm-editor';
import { displayError, isUserAbort } from '../../helpers/error-message.ts';
import { DecisionEdge, DecisionNode, normalizeGraphNodes } from '../../helpers/graph.ts';
import { assertAcyclic } from '../../lib/graph-cycle.ts';

enum DocumentFileTypes {
  Decision = 'application/vnd.gorules.decision',
}

const supportFSApi = Object.hasOwn(window, 'showSaveFilePicker');

/** 浏览器是否支持 File System Access API（页面据此决定 Save 按钮显隐与回退路径） */
export const isFileSystemApiSupported = (): boolean => supportFSApi;

const stringifyDecisionFile = (graph: DecisionGraphType): string =>
  JSON.stringify({ contentType: DocumentFileTypes.Decision, ...graph }, null, 2);

interface UseLocalFileOptions {
  /** 隐藏 <input type=file>（页面持有：无 File System Access API 时的回退打开通道） */
  fileInput: React.RefObject<HTMLInputElement>;
  graph: DecisionGraphType;
  setGraph: (graph: DecisionGraphType) => void;
  fileName: string;
  setFileName: (name: string) => void;
}

export interface LocalFileController {
  openFile: () => Promise<void>;
  saveFileLocal: () => Promise<void>;
  saveFileAsLocal: () => Promise<void>;
  handleUploadInput: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

/** 浏览器本地文件 IO（File System Access API + 下载/隐藏 input 回退）——与宿主存储无关的另一半持久化分支 */
export const useLocalFile = ({
  fileInput,
  graph,
  setGraph,
  fileName,
  setFileName,
}: UseLocalFileOptions): LocalFileController => {
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle>();

  const openFile = async () => {
    if (!supportFSApi) {
      fileInput.current?.click?.();
      return;
    }

    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ accept: { 'application/json': ['.json'] } }],
      });

      setFileHandle(handle);

      const file = await handle.getFile();
      const content = await file.text();
      setFileName(file?.name);
      const parsed = JSON.parse(content);
      setGraph({
        nodes: normalizeGraphNodes(parsed?.nodes || []),
        edges: parsed?.edges || [],
      });
    } catch (err) {
      if (!isUserAbort(err)) {
        displayError(err);
      }
    }
  };

  const handleDownload = async () => {
    try {
      assertAcyclic(graph.edges ?? []);
      // create file in browser
      const newFileName = `${fileName.replaceAll('.json', '')}.json`;
      const json = stringifyDecisionFile(graph);
      const blob = new Blob([json], { type: 'application/json' });
      const href = URL.createObjectURL(blob);

      // create "a" HTLM element with href to file
      const link = window.document.createElement('a');
      link.href = href;
      link.download = newFileName;
      window.document.body.appendChild(link);
      link.click();

      // clean up "a" element & remove ObjectURL
      window.document.body.removeChild(link);
      URL.revokeObjectURL(href);
    } catch (e) {
      displayError(e);
    }
  };

  const saveFileAsLocal = async () => {
    if (!supportFSApi) {
      return await handleDownload();
    }

    let writable: FileSystemWritableFileStream | undefined = undefined;
    try {
      assertAcyclic(graph.edges ?? []);
      const json = stringifyDecisionFile(graph);
      const newFileName = `${fileName.replaceAll('.json', '')}.json`;
      const handle = await window.showSaveFilePicker({
        types: [{ description: newFileName, accept: { 'application/json': ['.json'] } }],
      });

      writable = await handle.createWritable();
      await writable.write(json);
      setFileHandle(handle);
      const file = await handle.getFile();
      setFileName(file.name);
      toast.success('File saved');
    } catch (e) {
      if (!isUserAbort(e)) {
        displayError(e);
      }
    } finally {
      writable?.close?.();
    }
  };

  const saveFileLocal = async () => {
    if (fileHandle) {
      let writable: FileSystemWritableFileStream | undefined = undefined;
      try {
        writable = await fileHandle.createWritable();
        assertAcyclic(graph.edges ?? []);

        const json = stringifyDecisionFile(graph);
        await writable.write(json);
        toast.success('File saved');
      } catch (e) {
        displayError(e);
      } finally {
        writable?.close?.();
      }
    }
  };

  const handleUploadInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event?.target?.files as FileList;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e?.target?.result as string);
        if (parsed?.contentType !== DocumentFileTypes.Decision) {
          throw new Error('Invalid content type');
        }

        const nodes: DecisionNode[] = parsed.nodes || [];
        const nodeIds = nodes.map((node) => node.id);
        const edges: DecisionEdge[] = ((parsed.edges || []) as DecisionEdge[]).filter(
          (edge) => nodeIds.includes(edge?.targetId) && nodeIds.includes(edge?.sourceId),
        );

        assertAcyclic(edges);
        setGraph({ edges, nodes: normalizeGraphNodes(nodes) });
        setFileName(fileList?.[0]?.name);
      } catch (e) {
        displayError(e);
      }
    };

    reader.readAsText(Array.from(fileList)?.[0], 'UTF-8');
  };

  return { openFile, saveFileLocal, saveFileAsLocal, handleUploadInput };
};
