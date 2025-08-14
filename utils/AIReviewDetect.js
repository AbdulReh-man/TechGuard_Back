// Call AI API to analyze the review comment
const callAIApi = async (comment) => {
  // AOI will calll here to analyze the comment
  return {
    isFake: false,
    confidenceScore: 0.9,
    flaggedReasons: [],
    analyzedAt: new Date(),
  };
};

export const AIReviewDetect = async (comment) => {
  const aiResult = await callAIApi(comment);
  return aiResult;
};
