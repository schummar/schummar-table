export const textMatch = (text: string, query: string): boolean => {
  text = text.toLowerCase();
  query = query.toLowerCase();
  return query.split(/\s+/).every((part) => termMatch(text, part));
};

export const termMatch = (text: string, query: string): boolean => {
  let i = 0;
  outer: for (const char of query) {
    for (; i < text.length; i++) {
      if (text[i] === char) {
        i++;
        continue outer;
      }
    }
    return false;
  }
  return true;
};
