export function greedyGraphMatching(student, peers) {
  // Treat peers as graph nodes weighted by charge difference
  let bestPeer = null;
  let minCost = Infinity;

  peers.forEach(peer => {
    const cost = Math.abs(student.rangeBudget - peer.charges);
    if (cost < minCost) {
      minCost = cost;
      bestPeer = peer;
    }
  });

  return bestPeer;
}
