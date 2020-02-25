const parseQuery = (query: string): QueryAsArrays => {
  //   console.log(`query string is ${query}`);
  const output = {};

  if (query.length === 0) {
    return output;
  }
  const params = query.split('&');

  params.forEach(param => {
    const pair = param.split('=');
    if (output[pair[0]]) {
      output[pair[0]] = [...output[pair[0]], pair[1]];
    } else {
      output[pair[0]] = [pair[1]];
    }
  });

  //   console.log(output);
  return output;
};

export { parseQuery };

interface QueryAsArrays {
  [key: string]: string[];
}
