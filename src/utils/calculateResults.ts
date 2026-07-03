import type { AperitifEvent, EventResults, ResultState } from "../types/apero";

export function calculateEventResults(event: AperitifEvent): EventResults[] {
  return event.options.map((option) => {
    const result = event.participants.reduce(
      (currentResult, participant) => {
        const vote = participant.votes[option.id];

        if (vote === "yes") {
          currentResult.yesCount += 1;
        }

        if (vote === "maybe") {
          currentResult.maybeCount += 1;
        }

        if (vote === "no") {
          currentResult.noCount += 1;
        }

        currentResult.score = currentResult.yesCount * 10 + currentResult.maybeCount;
        return currentResult;
      },
      {
        optionId: option.id,
        yesCount: 0,
        maybeCount: 0,
        noCount: 0,
        score: 0,
      },
    );

    return result;
  });
}

export const TRAQUENARD_LEVEL_MAX = 10;

// Moyenne du Traquenard-O-mètre parmi les convives qui ont voté.
// `null` tant que personne n'a encore donné son avis.
export function calculateAverageTraquenardLevel(event: AperitifEvent): number | null {
  const levels = event.participants
    .map((participant) => participant.traquenardLevel)
    .filter((level): level is number => typeof level === "number");

  if (levels.length === 0) {
    return null;
  }

  return levels.reduce((total, level) => total + level, 0) / levels.length;
}

export function calculateBestOptions(event: AperitifEvent): ResultState {
  const results = calculateEventResults(event);

  if (event.participants.length === 0) {
    return {
      type: "empty",
      message: "Personne n’a encore répondu. Sois le premier, ou la première, à donner le ton !",
      results,
    };
  }

  const sortedResults = [...results].sort((left, right) => {
    if (right.yesCount !== left.yesCount) {
      return right.yesCount - left.yesCount;
    }

    if (right.maybeCount !== left.maybeCount) {
      return right.maybeCount - left.maybeCount;
    }

    return left.noCount - right.noCount;
  });

  const bestResult = sortedResults[0];

  if (!bestResult || (bestResult.yesCount === 0 && bestResult.maybeCount === 0)) {
    return {
      type: "no-availability",
      message: "Personne n’est chaud pour l’instant. Une nouvelle date fera peut-être pencher la balance.",
      results,
    };
  }

  const tiedResults = results.filter(
    (result) =>
      result.yesCount === bestResult.yesCount &&
      result.maybeCount === bestResult.maybeCount &&
      result.noCount === bestResult.noCount,
  );

  if (tiedResults.length > 1) {
    return {
      type: "tie",
      message: "Ça hésite encore entre plusieurs options, les avis ne sont pas tranchés.",
      optionIds: tiedResults.map((result) => result.optionId),
      results,
    };
  }

  return {
    type: "winner",
    message:
      bestResult.yesCount > 0
        ? "C’est calé : il ne reste plus qu’à sortir les glaçons !"
        : "Ça penche pour cette option, sans certitude absolue.",
    optionId: bestResult.optionId,
    results,
  };
}
