export const parseAnalysisText = (analysisText) => {
  if (!analysisText || typeof analysisText !== 'string') {
    return { decision: 'N/A', reasoning: 'N/A', summary: analysisText || 'N/A', recommendation_boolean: false };
  }

  let decision = 'N/A';
  let reasoning = 'N/A';
  let summary = analysisText; // Fallback inicial
  let recommendation_boolean = false;

  const newFormatDecisionMatch = analysisText.match(/Decisión de Recomendación: (.*?)\.(?: Razonamiento:|$)/i);
  if (newFormatDecisionMatch && newFormatDecisionMatch[1]) {
    decision = newFormatDecisionMatch[1].trim();
    recommendation_boolean = decision.toLowerCase() === 'sí';

    const newFormatReasoningMatch = analysisText.match(/Razonamiento: (.*?)\.(?: Resumen General:|$)/i);
    if (newFormatReasoningMatch && newFormatReasoningMatch[1]) {
      reasoning = newFormatReasoningMatch[1].trim();
    }

    const newFormatSummaryMatch = analysisText.match(/Resumen General: (.*)/i);
    if (newFormatSummaryMatch && newFormatSummaryMatch[1]) {
      summary = newFormatSummaryMatch[1].trim();
    } else if (newFormatReasoningMatch && newFormatReasoningMatch[0]) {
        const reasoningEndIndex = analysisText.toLowerCase().indexOf(newFormatReasoningMatch[0].toLowerCase()) + newFormatReasoningMatch[0].length;
        summary = analysisText.substring(reasoningEndIndex).trim();
         if(summary.startsWith(".")) summary = summary.substring(1).trim();
    } else {
         const decisionEndIndex = analysisText.toLowerCase().indexOf(newFormatDecisionMatch[0].toLowerCase()) + newFormatDecisionMatch[0].length;
         summary = analysisText.substring(decisionEndIndex).trim();
         if(summary.startsWith(".")) summary = summary.substring(1).trim();
    }
    if (summary === "") summary = "No disponible (parseado)";

  } else {
    const oldFormatRecomMatch = analysisText.match(/Recomendación: (Sí|No|Si)\.(?: Resumen:|$)/i);
    if (oldFormatRecomMatch && oldFormatRecomMatch[1]) {
      decision = oldFormatRecomMatch[1].trim();
      recommendation_boolean = decision.toLowerCase() === 'sí' || decision.toLowerCase() === 'si';
      
      const summarySplit = analysisText.split(/Resumen: /i);
      summary = summarySplit.length > 1 ? summarySplit[1].trim() : analysisText;
      reasoning = 'N/A (formato antiguo)';
    } else {
        recommendation_boolean = analysisText.toLowerCase().includes("recomendación: sí") || analysisText.toLowerCase().includes("recomendación: si");
    }
  }
  return { decision, reasoning, summary, recommendation_boolean };
};