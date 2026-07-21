# B-LAN Decentralized Inference Specification (v2.0)

## Overview
This specification outlines the transition of the **Civic-Twin Core** from the legacy **Lemonade REST API** to a decentralized, offline-first architecture powered by the **B-LAN (Broadband Local Area Network)** mesh protocol. 

The goal is to enable distributed inference across edge nodes in environments with intermittent connectivity (e.g., the McCoy Creek rewilding zone), utilizing a Store-and-Forward (STN) mechanism.

---

## 1. Libp2p Inference Wrapper: "Task-Lease" Architecture

The B-LAN node operates as a peer in a `libp2p` network, utilizing a **Task-Lease** pattern. This allows nodes to claim tasks locally and sync results once a mesh path is established.

### Technical Blueprint
1.  **Discovery**: Nodes use `Kademlia DHT` to find peers and `GossipSub` to subscribe to the `/civic-twin/tasks/v1` topic.
2.  **Task Broadcast**: A "Requester" node publishes a Task Object (CID) to the gossip network.
3.  **Checkout (Lease)**:
    *   A "Worker" node receives the task.
    *   It checks its local **DTN Metadata** (VRAM/Battery) to see if it can handle the load.
    *   It broadcasts a `CLAIM_TASK` message with a TTL (Time-to-Live).
4.  **Local Execution**: The worker executes the inference (via WasmEdge or ONNX) and stores the result in a local `Persistent Queue` (IndexedDB/SQLite).
5.  **Return (Sync)**: When the worker detects a peer with a path to the Requester (or a designated Sync Node), it pushes the Result Object (CID) and clears the local lease.

### Wrapper Logic (Pseudo-code)
```typescript
interface InferenceTask {
  id: string;
  model_cid: string;
  input_data: Uint8Array;
  priority: number;
}

class BLanInferenceWrapper {
  async onTaskReceived(task: InferenceTask) {
    if (this.hasResources(task.model_cid)) {
      await this.localQueue.push(task, 'PENDING');
      await this.gossip.publish('CLAIM_TASK', { taskId: task.id, peerId: this.peerId });
      
      const result = await this.engine.run(task);
      await this.localQueue.update(task.id, { result, status: 'COMPLETED' });
      
      this.attemptSync();
    }
  }
}
```

---

## 2. DTN Metadata Schema: Node Capability Discovery

To optimize task routing in a Disruption Tolerant Network (DTN), nodes must broadcast their "Health and Hardware" status.

### Schema (JSON-LD)
```json
{
  "@context": "https://civic-twin.org/ns/dtn-metadata-v1.jsonld",
  "node_id": "QmPeerId...",
  "hardware": {
    "vram_available_mb": 8192,
    "npu_type": "Apple-M2-Neural-Engine",
    "compute_units": 16,
    "power_source": "solar",
    "battery_level": 0.85
  },
  "network": {
    "avg_latency_ms": 45,
    "mesh_hops_to_gateway": 3,
    "last_sync_timestamp": "2026-04-06T05:44:17Z"
  },
  "supported_models": [
    "llama-3-8b-instruct-q4",
    "yolov8-rewilding-v2"
  ]
}
```

---

## 3. Resilience Comparison: McCoy Creek Rewilding Network

| Feature | NATS / MQTT Bridge | B-LAN (libp2p + DTN) |
| :--- | :--- | :--- |
| **Topology** | Hub-and-Spoke (Broker-based) | Pure Peer-to-Peer (Mesh) |
| **Connectivity** | Requires stable path to Broker | Works with 0% backbone (Local Sync) |
| **Failure Mode** | Broker failure kills the network | Graceful degradation (Partition-tolerant) |
| **Latency** | Low (if connected) | Variable (Store-and-Forward) |
| **Best Use Case** | Real-time sensor streaming | **McCoy Creek Rewilding (Remote/Offline)** |

### Why B-LAN for McCoy Creek?
The McCoy Creek rewilding project involves sensors scattered across dense terrain where cellular signal is non-existent. 
*   **NATS/MQTT** would fail the moment a single "bridge" node goes down, or if the creek's topography blocks the line-of-sight to the central hub.
*   **B-LAN** allows a sensor node to hand off data to a "mule" node (e.g., a passing ranger's handheld device or a drone) which later syncs with the main twin when it returns to base.

---

## 4. Implementation Roadmap
1.  **Phase 1**: Replace `axios` REST calls in `services/` with `libp2p-gossipsub` handlers.
2.  **Phase 2**: Implement the `PersistentQueue` using IndexedDB for browser-based nodes.
3.  **Phase 3**: Deploy the **DTN Metadata** broadcast every 60 seconds to build the local "Mesh Map".
4.  **Phase 4**: Integrate **WasmEdge** for local inference execution on the edge.
