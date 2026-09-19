import { normalize } from './catalog'
import type { FactItem } from '../types'

export type CuratedFacts = {
  keys: string[]
  items: FactItem[]
}

export const CURATED_FACTS: CuratedFacts[] = [
  {
    keys: ['nazarbayev university', 'назарбаев университет'],
    items: [
      {
        id: 'grant',
        label: 'Полный грант / стипендия',
        value: 'Грант NU покрывает обучение; конкурс отдельно от обычного ЕНТ-гранта',
        note: 'Для гранта NUET: от 120 баллов суммарно и не ниже 50 по каждому блоку. Международным топам — стипендия Абая.',
        source: 'NU Financial aid',
        sourceUrl: 'https://nu.edu.kz/admissions/how-to-apply/foundation-undergraduate/financial-aid-end-scholarships/',
      },
      {
        id: 'tuition',
        label: 'Платное обучение',
        value: 'Foundation $12 000 · бакалавриат $15 000 / год (2025/26)',
        note: 'Одинаково для граждан РК и иностранцев. Nursing — 3 066 000 ₸/год.',
        source: 'NU Admissions',
        sourceUrl: 'https://nu.edu.kz/admissions/how-to-apply/foundation-undergraduate/regular-admissions/',
      },
      {
        id: 'dorm',
        label: 'Общежитие',
        value: 'Ориентир ~$55 / мес на кампусе',
        note: 'Общие расходы NU оценивает примерно в $400 / мес вместе с едой.',
        source: 'NU Admissions',
        sourceUrl: 'https://nu.edu.kz/admissions/how-to-apply/foundation-undergraduate/regular-admissions/',
      },
      {
        id: 'admission',
        label: 'Обязательные условия',
        value: 'Заявка на admissions.nu.edu.kz, IELTS/TOEFL и GPA или ЕНТ',
        note: 'Бакалавриат: IELTS 6.0 (writing 6.0, остальные 5.5) и GPA 4.0/5 или ЕНТ 85. Foundation ниже. Тесты — очно, без superscore.',
        source: 'NU Regular admissions',
        sourceUrl: 'https://nu.edu.kz/admissions/how-to-apply/foundation-undergraduate/regular-admissions/',
      },
    ],
  },
  {
    keys: ['al-farabi kazakh national university', 'казахский национальный университет', 'казну'],
    items: [
      {
        id: 'grant',
        label: 'Полный грант',
        value: 'Госгрант МНВО покрывает обучение; общежитие и жизнь — отдельно',
        note: 'Конкурс грантов по сертификату ЕНТ. Проходной на грант зависит от группы ОП.',
        source: 'КазНУ, правила приёма',
        sourceUrl: 'https://www.kaznu.kz/RU/20562/page/',
      },
      {
        id: 'tuition',
        label: 'Платное обучение',
        value: 'Ориентир 1,0–1,9 млн ₸ / год, зависит от программы',
        note: 'Официальная таблица на текущий набор — на welcome.kaznu.kz. Не усредняем все факультеты в одну цифру.',
        source: 'КазНУ, стоимость',
        sourceUrl: 'https://welcome.kaznu.kz/ru/admissions/bachelor/stoimost/',
      },
      {
        id: 'dorm',
        label: 'Общежитие',
        value: 'Есть кампусные общежития для иногородних, место не гарантировано всем',
        note: 'Цену комнаты вуз публикует при заселении; в открытом профиле точную ставку не подставляем.',
        source: 'КазНУ',
        sourceUrl: 'https://www.kaznu.kz/',
      },
      {
        id: 'admission',
        label: 'Обязательные условия',
        value: 'ЕНТ от 65 баллов (пед./аграрные/ветеринария — от 60)',
        note: 'Не ниже 5 баллов по истории Казахстана, матграмотности, грамотности чтения и каждому профильному предмету. Творческие ОП — отдельный экзамен. Сокращённые программы — от 25.',
        source: 'КазНУ, п. 2.6 правил',
        sourceUrl: 'https://www.kaznu.kz/RU/20562/page/',
      },
    ],
  },
  {
    keys: ['satbayev university', 'сатпаев', 'казниту'],
    items: [
      {
        id: 'grant',
        label: 'Полный грант',
        value: 'Госгрант покрывает обучение; зачисление грантников через eGov',
        note: 'Бывают донаборы на вакантные грантовые места в течение года.',
        source: 'Satbayev University',
        sourceUrl: 'https://satbayev.university/en/news/the-process-of-enrollment-to-satbayev-university-for-first-year-students',
      },
      {
        id: 'tuition',
        label: 'Платное обучение',
        value: 'Зависит от образовательной программы, смотрите официальный прайс',
        note: 'В открытых карточках нет одной цифры «за весь вуз» — не выдумываем среднее.',
        source: 'Satbayev University',
        sourceUrl: 'https://satbayev.university/',
      },
      {
        id: 'dorm',
        label: 'Общежитие',
        value: 'Заявка онлайн: dormitory.satbayev.university',
        note: 'Первый курс обычно подаёт в августе. Приоритеты — по приказу МНВО № 219. Место не автоматическое.',
        source: 'Satbayev dormitory',
        sourceUrl: 'https://satbayev.university/en/news/dormitory-placement-situation-center-for-students',
      },
      {
        id: 'admission',
        label: 'Обязательные условия',
        value: 'ЕНТ, аттестат, медсправки 063/075, фото, военный учёт для юношей',
        note: 'Порог ЕНТ вуз указывает от 80 баллов, с минимумами по грамотности и профильным предметам. Творческие ОП — доп. экзамен.',
        source: 'Satbayev enrollment',
        sourceUrl: 'https://satbayev.university/en/news/the-process-of-enrollment-to-satbayev-university-for-first-year-students',
      },
    ],
  },
  {
    keys: ['massachusetts institute of technology', 'массачусетский технологический'],
    items: [
      {
        id: 'grant',
        label: 'Полный грант / aid',
        value: 'Нужды-ориентированная помощь MIT, не госгрант РК',
        note: 'Сильным кандидатам aid может закрыть всю стоимость. Need-blind для большинства бакалавров США.',
        source: 'MIT Admissions',
        sourceUrl: 'https://mitadmissions.org/afford/',
      },
      {
        id: 'tuition',
        label: 'Обучение и сборы',
        value: 'Ориентир $60 000+ / год tuition до aid',
        note: 'Точная смета года — на tuition странице MIT. Плюс жильё, еда и страховка.',
        source: 'MIT Student Financial Services',
        sourceUrl: 'https://sfs.mit.edu/undergraduate-students/the-cost-of-attendance/cost-of-attendance/',
      },
      {
        id: 'dorm',
        label: 'Общежитие',
        value: 'Первый курс живёт в резиденциях MIT, цена входит в cost of attendance',
        note: 'East Campus и другие дома — разные ставки. Сверяйте актуальный housing fee.',
        source: 'MIT Housing',
        sourceUrl: 'https://studentlife.mit.edu/housing',
      },
      {
        id: 'admission',
        label: 'Обязательные условия',
        value: 'Заявка MIT, школа, эссе, рекомендации; SAT/ACT по политике года',
        note: 'Отдельного «проходного балла ЕНТ» нет. Международным — ещё виза и подтверждение средств, если нет aid.',
        source: 'MIT Admissions',
        sourceUrl: 'https://mitadmissions.org/apply/',
      },
    ],
  },
  {
    keys: ['university of oxford', 'университет оксфорда', 'оксфордский университет'],
    items: [
      {
        id: 'grant',
        label: 'Полный грант / поддержка',
        value: 'Стипендии Oxford и госсподдержка UK; не грант МНВО РК',
        note: 'Для граждан РК обычно нужны внешние стипендии (Bolashak и др.) плюс оффер колледжа.',
        source: 'Oxford fees and funding',
        sourceUrl: 'https://www.ox.ac.uk/admissions/undergraduate/fees-and-funding',
      },
      {
        id: 'tuition',
        label: 'Обучение',
        value: 'Home и Overseas — разные ставки, плюс college fee',
        note: 'Overseas бакалавриат обычно несколько десятков тысяч фунтов в год. Смотрите course fee таблицы.',
        source: 'Oxford course fees',
        sourceUrl: 'https://www.ox.ac.uk/admissions/undergraduate/fees-and-funding/course-fees',
      },
      {
        id: 'dorm',
        label: 'Проживание',
        value: 'Первый курс обычно в колледже; цена — college accommodation',
        note: 'Это не общее «общежитие кампуса», а комната своего колледжа.',
        source: 'Oxford accommodation',
        sourceUrl: 'https://www.ox.ac.uk/students/life/accommodation',
      },
      {
        id: 'admission',
        label: 'Обязательные условия',
        value: 'UCAS, выбранный курс, оценки, часто admissions test и собеседование',
        note: 'У каждого курса свой тест (TSA, MAT, PAT и т.д.). Дедлайн бакалавриата обычно октябрь.',
        source: 'Oxford undergraduate admissions',
        sourceUrl: 'https://www.ox.ac.uk/admissions/undergraduate',
      },
    ],
  },
  {
    keys: ['stanford university', 'стэнфордский университет', 'стенфордский университет'],
    items: [
      {
        id: 'grant',
        label: 'Полный грант / aid',
        value: 'Need-based aid Stanford; при низкой семье tuition может быть $0',
        note: 'Это не казахстанский госгрант. Международный aid ограниченнее — читайте свежую политику.',
        source: 'Stanford Financial Aid',
        sourceUrl: 'https://financialaid.stanford.edu/',
      },
      {
        id: 'tuition',
        label: 'Обучение',
        value: 'Ориентир $60 000+ / год tuition до aid',
        note: 'Полный cost of attendance выше из-за жилья Silicon Valley.',
        source: 'Stanford Student Budget',
        sourceUrl: 'https://financialaid.stanford.edu/undergrad/budget/',
      },
      {
        id: 'dorm',
        label: 'Общежитие',
        value: 'Резиденции на кампусе, первый курс обычно живёт в campus housing',
        note: 'Ставка room and board публикуется в student budget на учебный год.',
        source: 'Stanford R&DE',
        sourceUrl: 'https://rde.stanford.edu/studenthousing',
      },
      {
        id: 'admission',
        label: 'Обязательные условия',
        value: 'Common App / Coalition, школа, эссе, рекомендации',
        note: 'Тесты — по политике года. Отдельного ЕНТ нет. Конкурс крайне высокий.',
        source: 'Stanford Undergraduate Admission',
        sourceUrl: 'https://admission.stanford.edu/apply/',
      },
    ],
  },
]

export const KZ_GENERIC_FACTS: FactItem[] = [
  {
    id: 'grant',
    label: 'Полный госгрант РК',
    value: 'Грант МНВО оплачивает обучение, не общежитие и не еду',
    note: 'Конкурс — по сертификату ЕНТ и группе образовательных программ. Сертификат гранта потом относят в выбранный вуз.',
    source: 'МНВО РК',
    sourceUrl: 'https://www.gov.kz/memleket/entities/sci',
  },
  {
    id: 'admission',
    label: 'Базовые условия бакалавриата',
    value: 'Аттестат + ЕНТ, иногда творческий экзамен',
    note: 'Пороговые баллы вуз и МНВО публикуют на набор. Точную цифру без официальной таблицы не ставим.',
    source: 'МНВО РК',
    sourceUrl: 'https://www.gov.kz/memleket/entities/sci',
  },
]

export function curatedFactsFor(name: string): FactItem[] {
  const n = normalize(name)
  const hit = CURATED_FACTS.find((row) => row.keys.some((key) => n.includes(key) || key.includes(n)))
  return hit?.items ?? []
}
