import { useState, type ReactNode } from 'react';
import { describe, expect, test, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser/context';
import { render } from 'vitest-browser-react';
import {
  DateFilter,
  exactCompare,
  prefixCompare,
  RangeFilter,
  SelectFilter,
  substringCompare,
  Table,
  TextFilter,
} from '..';
import CombinedFilter from '../components/combinedFilter';
import type { TableProps } from '../types';
import { persons, type Person } from './fixtures';

const INACTIVE_COLOR = 'rgb(176, 186, 201)';
const ALL_FIRST_NAMES = persons.map((p) => p.first_name);

type Filters = {
  firstName?: ReactNode;
  lastName?: ReactNode;
  jobTitle?: ReactNode;
  birthday?: ReactNode;
};

type ExtraProps = Pick<TableProps<Person>, 'enableClearFiltersButton' | 'onReset'>;

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

// Filters are debounced by 500ms, so give polls some headroom.
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
    await renderPersons({ firstName: <TextFilter /> });
    await expectFirstNames().toEqual(ALL_FIRST_NAMES);

    await openFilter('First Name');
    const input = page.getByRole('textbox');
    await expect.element(input).toBeVisible();
    await input.fill('AR');

    await expectFirstNames().toEqual(['Arne', 'Jarib', 'Eduard']);
  });

  test('clearing the text restores all rows', async () => {
    await renderPersons({ firstName: <TextFilter /> });
    await openFilter('First Name');
    const input = page.getByRole('textbox');
    await input.fill('ar');
    await expectFirstNames().toHaveLength(3);

    await input.fill('');
    await expectFirstNames().toEqual(ALL_FIRST_NAMES);
  });

  test('the clear icon button resets the text', async () => {
    await renderPersons({ firstName: <TextFilter /> });
    await openFilter('First Name');
    const input = page.getByRole('textbox');
    await input.fill('ar');
    await expectFirstNames().toHaveLength(3);

    await page.elementLocator(input.element().parentElement!.querySelector('button')!).click();
    await expect.element(input).toHaveValue('');
    await expectFirstNames().toEqual(ALL_FIRST_NAMES);
  });

  test('substringCompare matches anywhere', async () => {
    await renderPersons({ firstName: <TextFilter compare={substringCompare} defaultValue="el" /> });
    await expectFirstNames().toEqual(namesOf((p) => p.first_name.toLowerCase().includes('el')));
  });

  test('exactCompare matches the whole value only, ignoring case', async () => {
    await renderPersons({ firstName: <TextFilter compare={exactCompare} /> });
    await openFilter('First Name');
    const input = page.getByRole('textbox');

    await input.fill('arn');
    await expectFirstNames().toEqual([]);

    await input.fill('ARNE');
    await expectFirstNames().toEqual(['Arne']);
  });

  test('prefixCompare matches the start of the value only', async () => {
    await renderPersons({ firstName: <TextFilter compare={prefixCompare} defaultValue="ar" /> });
    await expectFirstNames().toEqual(['Arne']);
  });

  test('filterBy filters on a derived value', async () => {
    await renderPersons({
      firstName: <TextFilter filterBy={(_name: string, person: Person) => person.last_name} />,
    });
    await openFilter('First Name');
    await page.getByRole('textbox').fill('cooke');
    await expectFirstNames().toEqual(['Wanda']);
  });

  test('filterBy returning an array matches if any entry matches', async () => {
    await renderPersons({
      firstName: (
        <TextFilter
          filterBy={(name: string, person: Person) => [name, person.last_name]}
          defaultValue="co"
        />
      ),
    });
    await expectFirstNames().toEqual(
      namesOf((p) => /co/i.test(p.first_name) || /co/i.test(p.last_name)),
    );
  });

  test('Enter closes the popover and keeps the filter', async () => {
    await renderPersons({ firstName: <TextFilter /> });
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
    await renderPersons({ jobTitle: <SelectFilter /> });
    await openFilter('Job Title');

    await page.getByRole('textbox').fill('paralegal');
    await expect.poll(() => page.getByRole('checkbox').elements()).toHaveLength(1);
    await expect.element(page.getByRole('checkbox', { name: 'Paralegal' })).toBeInTheDocument();
  });

  test('virtual={false} renders all options', async () => {
    await renderPersons({ jobTitle: <SelectFilter virtual={false} /> });
    await openFilter('Job Title');

    const distinct = new Set(persons.map((p) => p.job_title));
    await expect.poll(() => page.getByRole('checkbox').elements()).toHaveLength(distinct.size);
  });

  test('checking options limits rows to those values', async () => {
    await renderPersons({ jobTitle: <SelectFilter /> });
    await openFilter('Job Title');

    await clickOption('Paralegal');
    await expectFirstNames().toEqual(['Dulcia', 'Arne']);

    await clickOption('Teacher');
    await expectFirstNames().toEqual(['Dulcia', 'Arne', 'Clemmie']);

    await page.getByRole('button', { name: 'Deselect all' }).click();
    await expectFirstNames().toEqual(ALL_FIRST_NAMES);
  });

  test('singleSelect replaces the previous selection', async () => {
    await renderPersons({ jobTitle: <SelectFilter singleSelect /> });
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

  function renderAges(filter: ReactNode) {
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
    await renderAges(<RangeFilter />);
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
    await renderAges(<RangeFilter min={21} max={22} />);
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
    await renderPersons({ birthday: <DateFilter defaultValue={nineties} /> });
    await expectFirstNames().toEqual(bornInNineties);
  });

  test('controlled value limits rows to the range', async () => {
    await renderPersons({ birthday: <DateFilter value={nineties} /> });
    await expectFirstNames().toEqual(bornInNineties);
  });

  test('a quick option applies its range and closes the popover, reset clears it', async () => {
    await renderPersons({
      birthday: (
        <DateFilter
          quickOptions={[{ label: 'Nineties', value: nineties }]}
          defaultDateInView={nineties.min}
        />
      ),
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
    await renderPersons({ firstName: <TextFilter />, jobTitle: <SelectFilter /> });

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
    await renderPersons({ firstName: <TextFilter />, lastName: <TextFilter /> });
    await expect.element(filterButton('First Name')).toHaveStyle({ color: INACTIVE_COLOR });

    await openFilter('First Name');
    await page.getByRole('textbox').fill('ar');
    await userEvent.keyboard('{Enter}');

    await expect.element(filterButton('First Name')).not.toHaveStyle({ color: INACTIVE_COLOR });
    await expect.element(filterButton('Last Name')).toHaveStyle({ color: INACTIVE_COLOR });
  });

  test('right-clicking the filter button resets the filter', async () => {
    await renderPersons({ firstName: <TextFilter defaultValue="ar" /> });
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
      { firstName: <TextFilter defaultValue="a" />, jobTitle: <SelectFilter /> },
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
    onChange: (value?: string) => void;
    onReset: (target: unknown) => void;
  }) {
    const [value, setValue] = useState('');

    return (
      <PersonTable
        enableClearFiltersButton
        onReset={(target) => {
          onReset(target);
          setValue('');
        }}
        filters={{
          firstName: (
            <TextFilter
              external
              value={value}
              onChange={(v) => {
                onChange(v);
                setValue(v ?? '');
              }}
            />
          ),
        }}
      />
    );
  }

  test('typing calls onChange but does not filter the items', async () => {
    const onChange = vi.fn();
    await render(<ExternalTable onChange={onChange} onReset={() => undefined} />);

    await openFilter('First Name');
    await page.getByRole('textbox').fill('ar');

    await expect.poll(() => onChange.mock.lastCall, { timeout: 3000 }).toEqual(['ar']);
    await expect.element(filterButton('First Name')).not.toHaveStyle({ color: INACTIVE_COLOR });
    expect(firstNames()).toEqual(ALL_FIRST_NAMES);
  });

  test('the clear filters button calls onReset', async () => {
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

describe('CombinedFilter', () => {
  test('exposes filters of columns hidden by display size', async () => {
    await render(
      <Table
        items={persons}
        id="id"
        enableSelection={false}
        displaySize="mobile"
        columns={(col) => [
          col((x) => x.first_name, {
            id: 'first_name',
            header: 'First Name',
            displaySize: 'desktop',
            filter: <TextFilter />,
          }),
          col((x) => x.last_name, {
            id: 'last_name',
            header: 'Last Name',
            renderCell: (v) => <span data-testid="last-name">{v}</span>,
            filter: <CombinedFilter />,
          }),
        ]}
      />,
    );
    const lastNames = () =>
      page
        .getByTestId('last-name')
        .elements()
        .map((e) => e.textContent);

    await openFilter('Last Name');
    await page.getByRole('button', { name: 'First Name' }).click();
    await page.getByRole('textbox').fill('ar');

    await expect.poll(lastNames, { timeout: 3000 }).toEqual(['Petow', 'Leamon', 'Cyster']);
    await expect.element(filterButton('Last Name')).not.toHaveStyle({ color: INACTIVE_COLOR });
  });
});
