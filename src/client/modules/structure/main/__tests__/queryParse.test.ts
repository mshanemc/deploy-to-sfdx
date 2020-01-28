import { parseQuery } from '../parseQueryVars';

it('single template', () => {
  expect(parseQuery('template=awesome')).toMatchObject({
    template: ['awesome']
  });
});

it('two templates', () => {
  expect(parseQuery('template=awesome&template=great')).toMatchObject({
    template: ['awesome', 'great']
  });
});

it('two templates plus something else ', () => {
  expect(parseQuery('template=awesome&template=great&other=fine')).toMatchObject({
    template: ['awesome', 'great'],
    other: ['fine']
  });
});
