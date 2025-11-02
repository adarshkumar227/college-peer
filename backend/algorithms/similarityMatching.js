export function similarityMatching(student, peers) {
  // Filter peers in same subject
  const sameDomainPeers = peers.filter(p => p.domain === student.subject);

  // Score by rating + experience closeness
  const scored = sameDomainPeers.map(peer => {
    const ratingDiff = Math.abs(peer.rating - student.rating);
    const expDiff = Math.abs(peer.experience - student.experience);
    const score = 1 / (1 + ratingDiff + expDiff); // Higher score = better match
    return { ...peer._doc, score };
  });

  // Sort by score (descending)
  scored.sort((a, b) => b.score - a.score);
  return scored[0] || null;
}
