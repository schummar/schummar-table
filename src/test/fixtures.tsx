import { render } from 'vitest-browser-react';
import { Table } from '..';
import type { TableProps } from '../types';

export type Person = {
  id: number;
  first_name: string;
  last_name: string;
  job_title: string;
  birthday: string;
};

// First 20 entries of docs/stories/_fakePersons.json, without avatars.
export const persons: Person[] = [
  {
    id: 1,
    first_name: 'Kassia',
    last_name: 'Nears',
    job_title: 'Occupational Therapist',
    birthday: '1965-05-03T13:47:23Z',
  },
  {
    id: 2,
    first_name: 'Dulcia',
    last_name: 'Grevel',
    job_title: 'Paralegal',
    birthday: '1976-10-21T08:58:33Z',
  },
  {
    id: 3,
    first_name: 'Chelsey',
    last_name: 'Skivington',
    job_title: 'Recruiting Manager',
    birthday: '1966-03-04T10:49:44Z',
  },
  {
    id: 4,
    first_name: 'Thoma',
    last_name: 'Greenroyd',
    job_title: 'Nurse Practicioner',
    birthday: '1979-09-18T01:09:51Z',
  },
  {
    id: 5,
    first_name: 'Maurene',
    last_name: 'Stroobant',
    job_title: 'Internal Auditor',
    birthday: '1998-09-24T00:45:41Z',
  },
  {
    id: 6,
    first_name: 'Julian',
    last_name: 'Terbrugge',
    job_title: 'Tax Accountant',
    birthday: '1988-10-19T19:11:56Z',
  },
  {
    id: 7,
    first_name: 'Arne',
    last_name: 'Petow',
    job_title: 'Paralegal',
    birthday: '1989-12-16T14:00:51Z',
  },
  {
    id: 8,
    first_name: 'Clemmie',
    last_name: 'Kisbey',
    job_title: 'Teacher',
    birthday: '2000-05-03T01:40:43Z',
  },
  {
    id: 9,
    first_name: 'Claude',
    last_name: 'Farncombe',
    job_title: 'Biostatistician I',
    birthday: '1985-04-24T09:14:47Z',
  },
  {
    id: 10,
    first_name: 'Delly',
    last_name: 'Chadd',
    job_title: 'Structural Engineer',
    birthday: '1984-09-13T12:54:57Z',
  },
  {
    id: 11,
    first_name: 'Jarib',
    last_name: 'Leamon',
    job_title: 'Clinical Specialist',
    birthday: '2002-05-07T03:22:19Z',
  },
  {
    id: 12,
    first_name: 'Eduard',
    last_name: 'Cyster',
    job_title: 'Dental Hygienist',
    birthday: '2001-05-14T20:36:22Z',
  },
  {
    id: 13,
    first_name: 'Addie',
    last_name: 'Lewcock',
    job_title: 'Community Outreach Specialist',
    birthday: '1978-03-22T06:51:52Z',
  },
  {
    id: 14,
    first_name: 'Rurik',
    last_name: 'Hardwell',
    job_title: 'Automation Specialist II',
    birthday: '1959-04-16T19:39:21Z',
  },
  {
    id: 15,
    first_name: 'Blithe',
    last_name: 'Colling',
    job_title: 'Senior Developer',
    birthday: '1992-12-29T20:46:01Z',
  },
  {
    id: 16,
    first_name: 'Willy',
    last_name: 'Bonnefin',
    job_title: 'Senior Sales Associate',
    birthday: '2004-08-05T18:54:38Z',
  },
  {
    id: 17,
    first_name: 'Danella',
    last_name: 'Stembridge',
    job_title: 'Financial Analyst',
    birthday: '1997-04-13T02:33:16Z',
  },
  {
    id: 18,
    first_name: 'Wanda',
    last_name: 'Cooke',
    job_title: 'Geological Engineer',
    birthday: '1983-03-27T04:27:38Z',
  },
  {
    id: 19,
    first_name: 'Dorotea',
    last_name: 'Hartop',
    job_title: 'Office Assistant III',
    birthday: '1953-05-27T16:00:07Z',
  },
  {
    id: 20,
    first_name: 'Shirlee',
    last_name: 'Lydiatt',
    job_title: 'Software Engineer II',
    birthday: '1972-01-05T05:59:01Z',
  },
];

export function renderTable<T>(props: TableProps<T>) {
  return render(<Table {...props} />);
}
