import { DTNMetadata, InferenceTask } from '../types';

/**
 * B-LAN Service (v2.0)
 * Implements the decentralized libp2p-based inference wrapper simulation.
 * In a real-world scenario, this would use @libp2p/libp2p and @libp2p/gossipsub.
 */
class BLanService {
  private localQueue: InferenceTask[] = [];
  private meshPeers: DTNMetadata[] = [];
  private nodeId: string = `node-${Math.random().toString(36).substr(2, 9)}`;

  constructor() {
    // Initialize with some mock mesh peers for the simulation
    this.meshPeers = [
      {
        node_id: 'QmPeerA',
        hardware: { vram_available_mb: 12000, npu_type: 'NVIDIA-Jetson-Orin', compute_units: 1024, power_source: 'grid', battery_level: 1.0 },
        network: { avg_latency_ms: 12, mesh_hops_to_gateway: 1, last_sync_timestamp: new Date().toISOString() },
        supported_models: ['llama-3-8b', 'yolov8']
      },
      {
        node_id: 'QmPeerB',
        hardware: { vram_available_mb: 4096, npu_type: 'Raspberry-Pi-5', compute_units: 4, power_source: 'solar', battery_level: 0.65 },
        network: { avg_latency_ms: 120, mesh_hops_to_gateway: 4, last_sync_timestamp: new Date().toISOString() },
        supported_models: ['tiny-llama', 'mobilenet']
      }
    ];
  }

  /**
   * Broadcasts a task to the mesh.
   * In B-LAN, this would be a GossipSub publish.
   */
  async broadcastTask(task: Omit<InferenceTask, 'id' | 'status'>): Promise<string> {
    const taskId = `task-${Date.now()}`;
    const newTask: InferenceTask = {
      ...task,
      id: taskId,
      status: 'PENDING'
    };
    
    this.localQueue.push(newTask);
    console.log(`[B-LAN] Task ${taskId} broadcasted to mesh.`);
    
    // Simulate a peer claiming the task after a delay
    setTimeout(() => this.simulatePeerClaim(taskId), 2000);
    
    return taskId;
  }

  private simulatePeerClaim(taskId: string) {
    const task = this.localQueue.find(t => t.id === taskId);
    if (task && task.status === 'PENDING') {
      const bestPeer = this.findBestWorker();
      task.status = 'CLAIMED';
      task.worker_id = bestPeer.node_id;
      console.log(`[B-LAN] Task ${taskId} claimed by ${bestPeer.node_id} (VRAM: ${bestPeer.hardware.vram_available_mb}MB)`);
      
      // Simulate completion
      setTimeout(() => {
        task.status = 'COMPLETED';
        task.result = `Inference result from ${bestPeer.node_id} for CID ${task.model_cid}`;
        console.log(`[B-LAN] Task ${taskId} completed and returned to queue.`);
      }, 5000);
    }
  }

  private findBestWorker(): DTNMetadata {
    // Logic: Highest VRAM and lowest latency
    return [...this.meshPeers].sort((a, b) => {
      const scoreA = a.hardware.vram_available_mb / a.network.avg_latency_ms;
      const scoreB = b.hardware.vram_available_mb / b.network.avg_latency_ms;
      return scoreB - scoreA;
    })[0];
  }

  getQueue(): InferenceTask[] {
    return [...this.localQueue];
  }

  getMeshStatus(): DTNMetadata[] {
    return [...this.meshPeers];
  }

  getNodeId(): string {
    return this.nodeId;
  }
}

export const bLanService = new BLanService();
