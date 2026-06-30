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

export function calculateBestOptions(event: AperitifEvent): ResultState {
  const results = calculateEventResults(event);

  if (event.participants.length === 0) {
    return {
      type: "empty",
      message: "Personne n'a encore glisse son bulletin dans l'urne du zinc.",
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
      message: "Personne n'est dispo. Change de potes ou change de date.",
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
      message: "Egalite parfaite, ca sent le debat de comptoir.",
      optionIds: tiedResults.map((result) => result.optionId),
      results,
    };
  }

  return {
    type: "winner",
    message:
      bestResult.yesCount > 0
        ? "On tient une date. Prevenez les glacons."
        : "Le zinc a rendu son jugement, sans grande conviction.",
    optionId: bestResult.optionId,
    results,
  };
}
