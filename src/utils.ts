import type { fullSnapshotEvent } from '@rrweb/types';
import type { SerializedNodeWithId } from './types';

export const indent = (level: number) => ' '.repeat(level);
/**
 * Builds a map of all nodes by their IDs from a FullSnapshotEvent.
 * @param rootNode - The root node of the snapshot tree.
 * @returns A map where keys are node IDs and values are the corresponding nodes.
 */
export const buildNodeMapFromFullSnapshots = (
  fullSnapshots: fullSnapshotEvent[],
): Map<number, SerializedNodeWithId> => {
  const idMap = new Map<number, SerializedNodeWithId>();

  // Iterate over each FullSnapshotEvent
  fullSnapshots.forEach((snapshot: fullSnapshotEvent) => {
    const rootNode = snapshot.data.node; // Get the root node of the full snapshot

    // Recursive function to process each node and add it to the map
    function processNode(node: SerializedNodeWithId) {
      idMap.set(node.id, node); // Add node to map using its ID

      // Recursively process child nodes, if any
      if (node.childNodes) {
        node.childNodes.forEach((childNode) => {
          processNode(childNode);
        });
      }
    }

    // Start the recursive node processing from the root node
    processNode(rootNode);
  });

  return idMap;
};
