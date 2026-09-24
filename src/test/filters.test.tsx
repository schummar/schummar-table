import { createRef, useState } from 'react';
import { describe, expect, test, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser/context';
import { render } from 'vitest-browser-react';
import { dateFilter, defineFilter, rangeFilter, selectFilter, Table, textFilter } from '..';
import type { ColumnFactory, Filter, Id, SingleOrMultiple, TableProps, TableRef } from '../types';
import { persons, type Person } from './fixtures';

const INACTIVE_COLOR = 'rgb(176, 186, 201)';
const ALL_FIRST_NAMES = persons.map((p) => p.first_name);

type Filters = {
  firstName?: Filter<string>;
  firstNameBy?: (name: string, person: Person) => SingleOrMultiple<string>;
  lastName?: Filter<string>;
  jobTitle?: Filter<string>;
  birthday?: Filter<Date>;
};

type ExtraProps = Omit<Partial<TableProps<Person>>, 'columns'> & { ref?: React.Ref<TableRef> };

function PersonTable({ filters, ...props }: { filters: Filters } & ExtraProps) {
  return (
    <Table
      items={persons}
      id="id"
      enableSelection={false}
      columns={(col) => [
        col((x) => x.first_name, {
          id: 'first_name',
          header: 'First Name',
          renderCell: (v) => <span data-testid="first-name">{v}</span>,
          filterBy: filters.firstNameBy,
          filter: filters.firstName,
        }),
        col((x) => x.last_name, {
          id: 'last_name',
          header: 'Last Name',
          filter: filters.lastName,
        }),
        col((x) => x.job_title, {
          id: 'job_title',
          header: 'Job Title',
          filter: filters.jobTitle,
        }),
        col((x) => new Date(x.birthday), {
          id: 'birthday',
          header: 'Birthday',
          renderCell: (d) => d.toISOString().slice(0, 10),
          filter: filters.birthday,
        }),
      ]}
      {...props}
    />
  );
}

function renderPersons(filters: Filters, props: ExtraProps = {}) {
  return render(<PersonTable filters={filters} {...props} />);
}

function firstNames() {
  return page
    .getByTestId('first-name')
    .elements()
    .map((e) => e.textContent);
}

// Text filters are debounced by 300ms, so give polls some headroom.
function expectFirstNames() {
  return expect.poll(firstNames, { timeout: 3000 });
}

function namesOf(predicate: (p: Person) => boolean) {
  return persons.filter(predicate).map((p) => p.first_name);
}

function headerCell(header: string) {
  const label = page
    .getByText(header, { exact: true })
    .elements()
    .find((e) => e.closest('[data-testid^="__vitest_"]'));
  let node = label as HTMLElement | undefined | null;
  while (node && !node.querySelector(':scope > button')) node = node.parentElement;
  if (!node) throw new Error(`No filterable header "${header}"`);
  return node;
}

function filterButton(header: string) {
  return page.elementLocator(headerCell(header).querySelector(':scope > button')!);
}

async function openFilter(header: string) {
  await filterButton(header).click();
}

function closePopovers() {
  // Popover cards are portalled into body, each preceded by a full-page backdrop that closes it.
  for (const card of document.body.children) {
    if (card instanceof HTMLElement && card.style.visibility === 'visible') {
      (card.previousElementSibling as HTMLElement).click();
    }
  }
}

// The checkbox input itself is visually hidden; click its label like a user would.
async function clickOption(name: string) {
  const input = page.getByRole('checkbox', { name }).element();
  await page.elementLocator(input.closest('label')!).click();
}

describe('TextFilter', () => {
  test('opens from the header and narrows rows by case-insensitive substring', async () => {
    await renderPersons({ firstName: textFilter() });
    await expectFirstNames().toEqual(ALL_FIRST_NAMES);

    await openFilter('First Name');
    const input = page.getByRole('textbox');
    await expect.element(input).toBeVisible();
    await input.fill('AR');

    await expectFirstNames().toEqual(['Arne', 'Jarib', 'Eduard']);
  });

  test('clearing the text restores all rows', async () => {
    await renderPersons({ firstName: textFilter() });
    await openFilter('First Name');
    const input = page.getByRole('textbox');
    await input.fill('ar');
    await expectFirstNames().toHaveLength(3);

    await input.fill('');
    await expectFirstNames().toEqual(ALL_FIRST_NAMES);
  });

  test('the clear icon button resets the text', async () => {
    await renderPersons({ firstName: textFilter() });
    await openFilter('First Name');
    const input = page.getByRole('textbox');
    await input.fill('ar');
    await expectFirstNames().toHaveLength(3);

    await page.elementLocator(input.element().parentElement!.querySelector('button')!).click();
    await expect.element(input).toHaveValue('');
    await expectFirstNames().toEqual(ALL_FIRST_NAMES);
  });

  test('substringCompare matches anywhere', async () => {
    await renderPersons({ firstName: textFilter({ compare: 'contains', defaultValue: 'el' }) });
    await expectFirstNames().toEqual(namesOf((p) => p.first_name.toLowerCase().includes('el')));
  });

  test('exactCompare matches the whole value only, ignoring case', async () => {
    await renderPersons({ firstName: textFilter({ compare: 'exact' }) });
    await openFilter('First Name');
    const input = page.getByRole('textbox');

    await input.fill('arn');
    await expectFirstNames().toEqual([]);

    await input.fill('ARNE');
    await expectFirstNames().toEqual(['Arne']);
  });

  test('prefixCompare matches the start of the value only', async () => {
    await renderPersons({ firstName: textFilter({ compare: 'prefix', defaultValue: 'ar' }) });
    await expectFirstNames().toEqual(['Arne']);
  });

  test('filterBy filters on a derived value', async () => {
    await renderPersons({
      firstName: textFilter(),
      firstNameBy: (_name, person) => person.last_name,
    });
    await openFilter('First Name');
    await page.getByRole('textbox').fill('cooke');
    await expectFirstNames().toEqual(['Wanda']);
  });

  test('filterBy returning an array matches if any entry matches', async () => {
    await renderPersons({
      firstName: textFilter({ defaultValue: 'co' }),
      firstNameBy: (name, person) => [name, person.last_name],
    });
    await expectFirstNames().toEqual(
      namesOf((p) => /co/i.test(p.first_name) || /co/i.test(p.last_name)),
    );
  });

  test('Enter closes the popover and keeps the filter', async () => {
    await renderPersons({ firstName: textFilter() });
    await openFilter('First Name');
    const input = page.getByRole('textbox');
    await input.fill('ar');
    await userEvent.keyboard('{Enter}');

    await expect.element(input).not.toBeInTheDocument();
    await expectFirstNames().toEqual(['Arne', 'Jarib', 'Eduard']);
  });
});

describe('SelectFilter', () => {
  test('lists each distinct column value once', async () => {
    await renderPersons({ jobTitle: selectFilter() });
    await openFilter('Job Title');

    await page.getByRole('textbox').fill('paralegal');
    await expect.poll(() => page.getByRole('checkbox').elements()).toHaveLength(1);
    await expect.element(page.getByRole('checkbox', { name: 'Paralegal' })).toBeInTheDocument();
  });

  test('virtual={false} renders all options', async () => {
    await renderPersons({ jobTitle: selectFilter({ virtual: false }) });
    await openFilter('Job Title');

    const distinct = new Set(persons.map((p) => p.job_title));
    await expect.poll(() => page.getByRole('checkbox').elements()).toHaveLength(distinct.size);
  });

  test('checking options limits rows to those values', async () => {
    await renderPersons({ jobTitle: selectFilter() });
    await openFilter('Job Title');

    await clickOption('Paralegal');
    await expectFirstNames().toEqual(['Dulcia', 'Arne']);

    await clickOption('Teacher');
    await expectFirstNames().toEqual(['Dulcia', 'Arne', 'Clemmie']);

    await page.getByRole('button', { name: 'Deselect all' }).click();
    await expectFirstNames().toEqual(ALL_FIRST_NAMES);
  });

  test('singleSelect replaces the previous selection', async () => {
    await renderPersons({ jobTitle: selectFilter({ singleSelect: true }) });
    await openFilter('Job Title');

    await clickOption('Paralegal');
    await expectFirstNames().toEqual(['Dulcia', 'Arne']);

    await clickOption('Teacher');
    await expectFirstNames().toEqual(['Clemmie']);
  });
});

describe('RangeFilter', () => {
  const items = [
    { id: '1', name: 'John', age: 20 },
    { id: '2', name: 'Jane', age: 21 },
    { id: '3', name: 'Jack', age: 22 },
    { id: '4', name: 'Jill', age: 23 },
  ];

  function renderAges(filter: Filter<number>) {
    return render(
      <Table
        items={items}
        id="id"
        enableSelection={false}
        columns={(col) => [
          col((x) => x.name, {
            header: 'Name',
            renderCell: (v) => <span data-testid="first-name">{v}</span>,
          }),
          col((x) => x.age, { header: 'Age', filter }),
        ]}
      />,
    );
  }

  test('min and max inputs limit rows, placeholders show the data range', async () => {
    await renderAges(rangeFilter());
    await openFilter('Age');

    const min = page.getByPlaceholder('20');
    const max = page.getByPlaceholder('23');

    // NumberField commits on blur.
    await min.fill('21');
    await userEvent.tab();
    await expectFirstNames().toEqual(['Jane', 'Jack', 'Jill']);

    await max.fill('22');
    await userEvent.tab();
    await expectFirstNames().toEqual(['Jane', 'Jack']);

    await min.fill('');
    await userEvent.tab();
    await expectFirstNames().toEqual(['John', 'Jane', 'Jack']);
  });

  test('values are clamped to the min/max props', async () => {
    await renderAges(rangeFilter({ min: 21, max: 22 }));
    await openFilter('Age');

    const min = page.getByPlaceholder('21');
    await min.fill('0');
    await userEvent.tab();

    await expect.element(min).toHaveValue('21');
    await expectFirstNames().toEqual(['Jane', 'Jack', 'Jill']);
  });
});

describe('DateFilter', () => {
  const nineties = { min: new Date(1990, 0, 1), max: new Date(1999, 11, 31) };
  const bornInNineties = namesOf((p) => p.birthday >= '1990' && p.birthday < '2000');

  test('defaultValue limits rows to the range', async () => {
    await renderPersons({ birthday: dateFilter({ defaultValue: nineties }) });
    await expectFirstNames().toEqual(bornInNineties);
  });

  test('controlled value limits rows to the range', async () => {
    await renderPersons(
      { birthday: dateFilter() },
      { filterValues: new Map([['birthday', nineties]]) },
    );
    await expectFirstNames().toEqual(bornInNineties);
  });

  test('a quick option applies its range and closes the popover, reset clears it', async () => {
    await renderPersons({
      birthday: dateFilter({
        quickOptions: [{ label: 'Nineties', value: nineties }],
        defaultDateInView: nineties.min,
      }),
    });
    await openFilter('Birthday');

    const quickOption = page.getByRole('button', { name: 'Nineties' });
    await quickOption.click();
    await expectFirstNames().toEqual(bornInNineties);
    await expect.element(quickOption).not.toBeInTheDocument();

    await openFilter('Birthday');
    await page.getByRole('button', { name: 'Reset' }).click();
    await expectFirstNames().toEqual(ALL_FIRST_NAMES);
  });
});

describe('combining filters', () => {
  test('multiple active filters are ANDed', async () => {
    await renderPersons({ firstName: textFilter(), jobTitle: selectFilter() });

    await openFilter('First Name');
    await page.getByRole('textbox').fill('ar');
    await userEvent.keyboard('{Enter}');
    await expectFirstNames().toEqual(['Arne', 'Jarib', 'Eduard']);

    await openFilter('Job Title');
    await clickOption('Paralegal');
    await expectFirstNames().toEqual(['Arne']);
  });
});

describe('active filter indicator', () => {
  test('header filter button is highlighted while its filter is active', async () => {
    await renderPersons({ firstName: textFilter(), lastName: textFilter() });
    await expect.element(filterButton('First Name')).toHaveStyle({ color: INACTIVE_COLOR });

    await openFilter('First Name');
    await page.getByRole('textbox').fill('ar');
    await userEvent.keyboard('{Enter}');

    await expect.element(filterButton('First Name')).not.toHaveStyle({ color: INACTIVE_COLOR });
    await expect.element(filterButton('Last Name')).toHaveStyle({ color: INACTIVE_COLOR });
  });

  test('right-clicking the filter button resets the filter', async () => {
    await renderPersons({ firstName: textFilter({ defaultValue: 'ar' }) });
    await expectFirstNames().toHaveLength(3);

    await filterButton('First Name').click({ button: 'right' });
    await expectFirstNames().toEqual(ALL_FIRST_NAMES);
    await expect.element(filterButton('First Name')).toHaveStyle({ color: INACTIVE_COLOR });
  });
});

describe('clear filters button', () => {
  test('appears when a filter is active and clears all filters', async () => {
    const onReset = vi.fn();
    await renderPersons(
      { firstName: textFilter({ defaultValue: 'a' }), jobTitle: selectFilter() },
      { enableClearFiltersButton: true, onReset },
    );
    const clear = page.getByRole('button', { name: 'Clear all filters' });
    await expect.element(clear).toBeVisible();

    await openFilter('Job Title');
    await clickOption('Paralegal');
    await expectFirstNames().toEqual(['Dulcia', 'Arne']);
    closePopovers();

    await clear.click();
    await expectFirstNames().toEqual(ALL_FIRST_NAMES);
    expect(onReset).toHaveBeenCalledWith('filters');
    await expect.element(clear).not.toBeInTheDocument();
  });
});

describe('external filters', () => {
  function ExternalTable({
    onChange,
    onReset,
  }: {
    onChange: (values: Map<Id, unknown>) => void;
    onReset: (target: unknown) => void;
  }) {
    const [filterValues, setFilterValues] = useState(new Map<Id, unknown>());

    return (
      <PersonTable
        enableClearFiltersButton
        onReset={onReset}
        filterValues={filterValues}
        onFilterValuesChange={(values) => {
          onChange(values);
          setFilterValues(values);
        }}
        filters={{ firstName: textFilter({ external: true }) }}
      />
    );
  }

  test('typing reports the value but does not filter the items', async () => {
    const onChange = vi.fn();
    await render(<ExternalTable onChange={onChange} onReset={() => undefined} />);

    await openFilter('First Name');
    await page.getByRole('textbox').fill('ar');

    await expect
      .poll(() => onChange.mock.lastCall?.[0].get('first_name'), { timeout: 3000 })
      .toBe('ar');
    await expect.element(filterButton('First Name')).not.toHaveStyle({ color: INACTIVE_COLOR });
    expect(firstNames()).toEqual(ALL_FIRST_NAMES);
  });

  test('the clear filters button clears the value and calls onReset', async () => {
    const onReset = vi.fn();
    await render(<ExternalTable onChange={() => undefined} onReset={onReset} />);

    await openFilter('First Name');
    const input = page.getByRole('textbox');
    await input.fill('ar');
    await userEvent.keyboard('{Enter}');

    await page.getByRole('button', { name: 'Clear all filters' }).click();
    expect(onReset).toHaveBeenCalledWith('filters');

    await openFilter('First Name');
    await expect.element(page.getByRole('textbox')).toHaveValue('');
  });
});

describe('hidden columns', () => {
  const hideFirstName = new Set<Id>(['first_name']);

  test('keep their filter value but stop applying it', async () => {
    function Toggle() {
      const [hidden, setHidden] = useState(new Set<Id>());
      return (
        <>
          <button onClick={() => setHidden(hidden.size ? new Set() : hideFirstName)}>toggle</button>
          <PersonTable
            filters={{ firstName: textFilter({ defaultValue: 'ar' }) }}
            hiddenColumns={hidden}
          />
        </>
      );
    }
    await render(<Toggle />);
    // Kassia Nears doesn't match "ar".
    const text = () => document.body.textContent ?? '';
    await expect.poll(text).not.toContain('Nears');

    await page.getByRole('button', { name: 'toggle' }).click();
    await expect.poll(text).toContain('Nears');

    await page.getByRole('button', { name: 'toggle' }).click();
    await expect.poll(text).not.toContain('Nears');
  });

  test('with enableHiddenColumnFilters, their filters apply and are editable from the header', async () => {
    await renderPersons(
      { firstName: textFilter(), jobTitle: selectFilter() },
      {
        enableHiddenColumnFilters: true,
        enableColumnSelection: false,
        defaultHiddenColumns: hideFirstName,
      },
    );
    const lastNames = () => document.body.textContent ?? '';
    await expect.poll(lastNames).toContain('Nears');

    await page.elementLocator(document.querySelector('[data-schummar-table] button')!).click();
    await expect.element(page.getByText('Filters of hidden columns')).toBeVisible();
    await page.getByRole('button', { name: 'First Name' }).click();
    await page.getByRole('textbox').fill('ar');

    await expect.poll(lastNames, { timeout: 3000 }).not.toContain('Nears');
    expect(lastNames()).toContain('Cyster');
  });
});

describe('controlled filter values', () => {
  test('follow the parent and report changes without applying them', async () => {
    const onChange = vi.fn();
    function Parent() {
      const [values, setValues] = useState(new Map<Id, unknown>([['first_name', 'ar']]));
      return (
        <>
          <button onClick={() => setValues(new Map([['first_name', 'arne']]))}>arne</button>
          <PersonTable
            filters={{ firstName: textFilter(), jobTitle: selectFilter() }}
            filterValues={values}
            onFilterValuesChange={onChange}
          />
        </>
      );
    }
    await render(<Parent />);
    await expectFirstNames().toEqual(['Arne', 'Jarib', 'Eduard']);

    await page.getByRole('button', { name: 'arne' }).click();
    await expectFirstNames().toEqual(['Arne']);

    await openFilter('Job Title');
    await clickOption('Paralegal');
    await expect
      .poll(() => onChange.mock.lastCall?.[0].get('job_title'))
      .toEqual(new Set(['Paralegal']));
    expect(firstNames()).toEqual(['Arne']);
  });

  test('the table ref reads and sets filter values', async () => {
    const ref = createRef<TableRef>();
    await render(
      <PersonTable ref={ref} filters={{ firstName: textFilter({ defaultValue: 'ar' }) }} />,
    );
    await expectFirstNames().toEqual(['Arne', 'Jarib', 'Eduard']);
    expect(ref.current!.getFilterValues().get('first_name')).toBe('ar');

    ref.current!.setFilterValues(new Map([['first_name', 'arne']]));
    await expectFirstNames().toEqual(['Arne']);
  });

  test('clearing filters clears hidden columns too', async () => {
    const onChange = vi.fn();
    await renderPersons(
      { firstName: textFilter({ defaultValue: 'a' }), lastName: textFilter({ defaultValue: 'o' }) },
      {
        enableClearFiltersButton: true,
        defaultHiddenColumns: new Set(['last_name']),
        onFilterValuesChange: onChange,
      },
    );
    await page.getByRole('button', { name: 'Clear all filters' }).click();
    await expect
      .poll(() => onChange.mock.lastCall?.[0])
      .toEqual(
        new Map<Id, unknown>([
          ['first_name', undefined],
          ['last_name', undefined],
        ]),
      );
  });
});

describe('filter descriptors', () => {
  function countingFilter() {
    const calls = { render: 0, test: 0 };
    const filter = defineFilter<string, string>({
      isActive: (value) => !!value,
      test: (value, x) => {
        calls.test++;
        return x.includes(value);
      },
      Component: ({ value, onChange }) => {
        calls.render++;
        return (
          <input
            aria-label="counting"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      },
    });
    return { calls, filter };
  }

  test('the filter UI only renders while open', async () => {
    const { calls, filter } = countingFilter();
    await renderPersons({ firstName: filter() });
    await expectFirstNames().toEqual(ALL_FIRST_NAMES);
    expect(calls.render).toBe(0);

    await openFilter('First Name');
    await page.getByRole('textbox', { name: 'counting' }).fill('Ar');
    await expectFirstNames().toEqual(['Arne']);
    expect(calls.render).toBeGreaterThan(0);

    closePopovers();
    await expect.element(page.getByRole('textbox', { name: 'counting' })).not.toBeInTheDocument();
  });

  test('default values filter the first render', async () => {
    await renderPersons({ firstName: textFilter({ compare: 'prefix', defaultValue: 'ar' }) });
    expect(firstNames()).toEqual(['Arne']);
  });

  test('filters created inline on each render do not refilter', async () => {
    const { calls, filter } = countingFilter();
    const firstName = (person: Person) => person.first_name;
    function Parent() {
      const [count, setCount] = useState(0);
      return (
        <>
          <button onClick={() => setCount(count + 1)}>rerender {count}</button>
          <Table
            items={persons}
            id="id"
            columns={[
              { id: 'first_name', value: firstName, filter: filter({ defaultValue: 'a' }) },
            ]}
          />
        </>
      );
    }
    await render(<Parent />);
    await expect.poll(() => calls.test).toBeGreaterThan(0);
    const testCalls = calls.test;

    await page.getByRole('button', { name: 'rerender 0' }).click();
    await expect.element(page.getByRole('button', { name: 'rerender 1' })).toBeInTheDocument();
    expect(calls.test).toBe(testCalls);
  });

  test('onFilterValuesChange reports values, defaults included', async () => {
    const onChange = vi.fn();
    await renderPersons(
      { firstName: textFilter({ defaultValue: 'a' }), jobTitle: selectFilter() },
      { onFilterValuesChange: onChange },
    );
    await openFilter('Job Title');
    await clickOption('Paralegal');

    await expect
      .poll(() => onChange.mock.lastCall?.[0])
      .toEqual(
        new Map<Id, unknown>([
          ['first_name', 'a'],
          ['job_title', new Set(['Paralegal'])],
        ]),
      );
  });
});

describe('filter types', () => {
  test('filters are checked against the column value or filterBy', () => {
    type Item = { name: string; age: number; tags: string[]; birthday: Date; iso: '2024-01-01' };
    const col: ColumnFactory<Item> = (value, column) => ({ ...column, value });

    col((x) => x.name, { filter: textFilter(), renderCell: (v) => v.toUpperCase() });
    col((x) => x.age, { filter: textFilter() });
    col((x) => x.tags, { filter: textFilter() });
    col((x) => x.name, { filter: selectFilter() });
    col((x) => x.tags, { filter: selectFilter({ defaultValue: new Set(['a']) }) });
    col((x) => x.age, { filter: rangeFilter() });
    col((x) => x.birthday, { filter: dateFilter() });
    col((x) => x.iso, { filter: dateFilter() });
    col((x) => x.birthday, { filterBy: (d) => d.getFullYear(), filter: rangeFilter() });
    col((x) => x.birthday, {
      filterBy: (_d, item) => item.name,
      filter: selectFilter({ render: (value: string) => value.toUpperCase() }),
    });

    // @ts-expect-error a string column with a number select
    col((x) => x.name, { filter: selectFilter({ defaultValue: new Set([1]) }) });
    // @ts-expect-error options of the wrong type
    col((x) => x.tags, { filter: selectFilter({ options: [1, 2] }) });
    // @ts-expect-error a range filter on strings
    col((x) => x.name, { filter: rangeFilter() });
    // @ts-expect-error a text filter on dates
    col((x) => x.birthday, { filter: textFilter() });
    // @ts-expect-error filterBy returns strings, the range filter needs numbers
    col((x) => x.birthday, { filterBy: (d) => d.toISOString(), filter: rangeFilter() });
    // @ts-expect-error arbitrary strings are not dates
    col((x) => x.name, { filter: dateFilter() });
  });
});
