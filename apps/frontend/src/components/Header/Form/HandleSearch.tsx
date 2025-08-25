// @ts-nocheck
import {
  setCity,
  setInputSearchIds,
  setSelectedCountry,
  setSelectedIcon,
} from "../../../redux/AppSlice";

export function findMatchingKeys(inputString: string, arr: any[]) {
  const sanitizeString = (str: string) => {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[^a-zA-Z]/g, "").toLowerCase();
  };
  const sanitizedInput = sanitizeString(inputString);

  const charFrequency = (str: string) => {
    return [...str].reduce((acc: Record<string, number>, char: string) => {
      acc[char] = (acc[char] || 0) + 1;
      return acc;
    }, {});
  };

  const inputFrequency = charFrequency(sanitizedInput);

  const isNinetyPercentMatch = (inputFreq: Record<string, number>, targetFreq: Record<string, number>) => {
    let matchCount = 0;
    let totalChars = 0;

    for (let char in inputFreq) {
      if (targetFreq[char]) {
        matchCount += Math.min(inputFreq[char], targetFreq[char]);
      }
      totalChars += inputFreq[char];
    }

    return totalChars > 0 ? matchCount / totalChars >= 0.9 : false;
  };

  const result: string[] = [];

  arr.forEach((item) => {
    for (let key in item) {
      const sanitizedValue = sanitizeString(item[key]);
      const valueFrequency = charFrequency(sanitizedValue);

      if (isNinetyPercentMatch(inputFrequency, valueFrequency)) {
        result.push(key);
      }
    }
  });

  return result;
}

export function handleSearchInput(
  region: string,
  destinationInputVal: string,
  combinedString: any[],
  dispatch: any
) {
  let result;
  if (region !== "all") {
    result = findMatchingKeys(region || '', combinedString);
  } else {
    result = findMatchingKeys(destinationInputVal || '', combinedString);
  }

  dispatch(setInputSearchIds(result));
  dispatch(setSelectedCountry(""));
  dispatch(setCity(""));
  dispatch(setSelectedIcon(""));
}