import {findLastIndex} from "./find-last-index";
import {wordSeparator} from "../consts/word-separators";

export function takeSelectedWord(): string {
  const getSelection = window.getSelection();

  if (!getSelection) {
    return '';
  }

  const getSelectionToString = getSelection.toString().trim();

  if (getSelectionToString) {
    return getSelectionToString;
  }

  const focusOffset = getSelection.focusOffset;
  const nodeValue = getSelection.focusNode?.nodeValue;

  if (!nodeValue) {
    return '';
  }

  const nodeValueArr = nodeValue.split('');

  let firstIndex = findLastIndex(nodeValueArr, focusOffset, (value) => wordSeparator.includes(value));

  firstIndex = firstIndex === -1 ? 0 : firstIndex + 1;

  let lastIndex = nodeValueArr.findIndex((value, index) => wordSeparator.includes(value) && index > focusOffset);

  if (lastIndex === -1) {
    lastIndex = nodeValue.length;
  }

  return nodeValue.slice(firstIndex, lastIndex).trim();
}
