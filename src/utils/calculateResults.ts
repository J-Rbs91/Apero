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
      message:
        "Le registre est vierge, d’un blanc presque religieux. Aucun convive n’a encore déposé son suffrage, et en démocratie, ça s’appelle une abstention généralisée.",
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
      message:
        "Personne n’est disponible, absolument personne, et ça, dans l’histoire du zinc, ça s’appelle une crise de régime.",
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
      message:
        "Égalité parfaite, au suffrage près, ce qui ne s’était pas vu depuis la dernière fois. Les débats de comptoir continuent, plus vifs que jamais.",
      optionIds: tiedResults.map((result) => result.optionId),
      results,
    };
  }

  return {
    type: "winner",
    message:
      bestResult.yesCount > 0
        ? "Le verdict est tombé, dans le silence recueilli qui sied aux grandes décisions : les glaçons peuvent se préparer."
        : "La Confrérie semble pencher pour cette option.",
    optionId: bestResult.optionId,
    results,
  };
}
