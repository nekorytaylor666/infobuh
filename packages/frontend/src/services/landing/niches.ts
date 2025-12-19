import cafeHero from "@/assets/landing/hero-cafe.jpg";
import flowersHero from "@/assets/landing/hero-flowers.jpg";
import genericHero from "@/assets/landing/hero-generic.jpg";

import generatedeal1 from "@/assets/landing/generatedeal1.png";
import generatedeal2 from "@/assets/landing/generatedeal2.png";
import generatedeal3 from "@/assets/landing/generatedeal3.png";
import deal1 from "@/assets/landing/deal1.png";
import deal2 from "@/assets/landing/deal2.png";
import deal3 from "@/assets/landing/deal3.png";
import doc1 from "@/assets/landing/doc1.png";
import doc2 from "@/assets/landing/doc2.png";

import freelancer from "@/assets/landing/freelancer.png";
import freelancer1 from "@/assets/landing/freelancer1.png";
import freelancer2 from "@/assets/landing/freelancer2.png";
import freelancer4 from "@/assets/landing/freelancer4.png";

import freelancer5 from "@/assets/landing/freelancer5.png";

import freelancer6 from "@/assets/landing/freelancer6.png";
import freelancer7 from "@/assets/landing/freelancer7.png";

import freelancer8 from "@/assets/landing/freelancer8.png";

import freelancer9 from "@/assets/landing/freelancer9.png";

import freelancer10 from "@/assets/landing/freelancer10.png";


import onec1 from '@/assets/landing/onec1.png'
import onec2 from '@/assets/landing/onec2.png'

export type NicheAccordionItem = {
  title: string;
  text: string;
  image: string;
};

export type NicheBenefitsBlock = {
  labels: string[];

  problems: string[];

};

// Для DealsShowcase
export type DealGroupConfig = {
  images: string[];
  title: string;
  text: string;
};

export type DealsShowcaseBlock = {
  headerLabel: string;
  headerTitle: string;
  groups: DealGroupConfig[];
};

export type NicheConfig = {
  id: string;
  heroImage: string;
  heroKicker: string;
  heroTitle: string;
  heroText: string;

  whyBlock: NicheBenefitsBlock;

  // Блоки для двух вызовов <DealsShowcase />
  dealsBlocks?: DealsShowcaseBlock[];
};

export const niches: Record<string, NicheConfig> = {
  default: {
    id: "default",
    heroImage: genericHero,
    heroKicker: "БИЗНЕСУ",
    heroTitle: "Приложение, которое берет на себя всю бухгалтерию",
    heroText:
      "Документы, налоги, отчёты, ЭСФ - всё делается автоматически, быстро и без ошибок.",

    whyBlock: {
      labels: [],
      problems: [
        "Бухгалтерская рутина отнимает слишком много времени?",
        "Сложно отслеживать оплаты и документооборот?",
        "Непонятно, сколько платить налогов и когда сдавать отчёты?",
      ],
    },

    dealsBlocks: [
      {
        headerLabel: "ДОКУМЕНТООБОРОТ",
        headerTitle: "Создавайте документы за секунды",
        groups: [
          {
            images: [generatedeal1, generatedeal2, generatedeal3],
            title: "1. Создайте документы за 15 секунд",
            text: "Введите БИН контрагента и вашу услугу.\n\n Все реквизиты подтягиваются автоматически.",
          },
          {
            images: [deal1, deal2, deal3, doc1, doc2],
            title: "2. Храните всё в одном месте",
            text: "Документы, подписи, проводки и оплаты — в одном приложении.",
          },
          {
            images: [onec1, onec2],
            title: "3. Интеграция с 1С",
            text: "Подключите 1С и загружайте сделки одним кликом.",
          },
        ],
      },
    ],
  },
  freelancer: {
    id: "freelancer",
    heroImage: freelancer,
    heroKicker: "ФРИЛАНСЕРАМ",
    heroTitle: "Приложение, которое берет на себя всю бухгалтерию",
    heroText:
      "Документы, налоги, отчёты, ЭСФ - всё делается автоматически, быстро и без ошибок.",

    whyBlock: {
      labels: [
        "ДИЗАЙНЕРАМ",
        "ТАРГЕТОЛОГАМ",
        "SMM",
        "МАРКЕТОЛОГАМ",
        "КОПИРАЙТЕРАМ",
        "ЭКСПЕРТАМ",
        "РАЗРАБОТЧИКАМ",
      ],
      problems: [
        "Заказчик просит счет или АВР - приходится гуглить шаблоны?",
        "Есть страх, что заказ не оплатится без документов?",
        "Непонятно, сколько платить налогов, когда сдавать отчёт и как не получить штраф?",
      ],
    },

    dealsBlocks: [
      {
        headerLabel: "ДОКУМЕНТООБОРОТ",
        headerTitle: "Когда клиенту нужны документы, а вы не понимаете, что заполнять",
        groups: [
          {
            images: [freelancer9, generatedeal1, generatedeal2, generatedeal3],
            title: "1. Создайте документы заказчику за 15 секунд",
            text: "Введите БИН заказчика и вашу услугу.\n\n Все реквизиты, данные получателя и ваша информация подтягиваются сами. Нужные документы создаются автоматически.",
          },
          {
            images: [freelancer, freelancer1, freelancer2, freelancer4],
            title: "2. Храните сделки по заказам в одном месте",
            text: "Документы, подписи, проводки и оплаты — не в разных сервисах, а в одном приложении. Мониторьте оплату и ЭЦП подписи заказчика.",
          },
          {
            images: [freelancer10],
            title: "3. Подписывайте документы легко и бесплатно",
            text: "Документы подписываются в приложении и через сайт с помощью ЭЦП. Подписанные документы в Infobuh имеют юридическую силу по стандартам НУЦ РК. Можно скачать акт подписания.",
          },
        ],
      },
      {
        headerLabel: "НАЛОГИ",
        headerTitle: "Оплата налогов и сдача отчетов для ИП",
        groups: [
          {
            images: [freelancer5],
            title: "1. Доход ведется самостоятельно",
            text: "При создании сделки, сумма автоматически зачистляется в кассу, не нужно вести доход самому.",
          },
          {
            images: [freelancer6, freelancer7],
            title: "2. Налоги и отчеты для ИП",
            text: "Infobuh считает налог по вашему налоговому режиму, показывает точную сумму к оплате и период, объясняет как сдать отчет.",
          },
          {
            images: [freelancer8],
            title: "3. Получайте напоминания о сроках налогов",
            text: "Перед сдачей отчёта и оплатой налога приходят напоминания, чтобы вы не забыли и не получили штраф.",
          },
        ],
      },
    ],
  },
  accountance: {
    id: "accountance",
    heroImage: freelancer,
    heroKicker: "БУХГАЛТЕРАМ",
    heroTitle: "Приложение, которое облегчает бухгалтерскую рутину",
    heroText:
      "Документы, налоги, отчёты, ЭСФ - всё делается автоматически, быстро и без ошибок.",

    whyBlock: {
      labels: [
        "БУХГАЛТЕРАМ",
        "ГЛАВ. БУХАМ",
      ],
      problems: [
        "Клиент постоянно просит сделать первички?",
        "Постоянно отвлекают с актами сверок и отчетами по контрагентам?",
        "Формирование документов на реализацию и их подписание занимает слишком много времени?",
      ],
    },

    dealsBlocks: [
      {
        headerLabel: "ДОКУМЕНТООБОРОТ",
        headerTitle: "Научите своих клиентов документообороту",
        groups: [
          {
            images: [freelancer9, generatedeal1, generatedeal2, generatedeal3],
            title: "1. Создайте документы контрагенту за 15 секунд",
            text: "Введите БИН контрагента и вашу услугу.\n\n Все реквизиты, данные получателя и ваша информация подтягиваются сами. Нужные документы создаются автоматически.",
          },
          {
            images: [freelancer, freelancer1, freelancer2, freelancer4],
            title: "2. Храните сделки по реализации в одном месте",
            text: "Документы, подписи, проводки и оплаты — не в разных сервисах, а в одном приложении. Мониторьте оплату и ЭЦП подписи получателя.",
          },
          {
            images: [onec1, onec2],
            title: "3. Свяжите приложение с вашим 1С",
            text: "Подключите 1С за 15 минут, загружайте сделки одним кликом. \n Будет работать без ошибок, ваш 1С не поменяется.",
          },
        ],
      },
      {
        headerLabel: "НАЛОГИ",
        headerTitle: "Оплата налогов и сдача отчетов для ИП и ТОО",
        groups: [
          {
            images: [freelancer5],
            title: "1. Доход ведется самостоятельно",
            text: "При создании сделки, сумма автоматически зачистляется в кассу, не нужно вести доход самому.",
          },
          {
            images: [freelancer6, freelancer7],
            title: "2. Налоги и отчеты для ИП и ТОО",
            text: "Infobuh считает налог по вашему налоговому режиму, показывает точную сумму к оплате и период.",
          },
          {
            images: [freelancer8],
            title: "3. Получайте напоминания о сроках налогов",
            text: "Перед сдачей отчёта и оплатой налога приходят напоминания, чтобы вы не забыли и не получили штраф.",
          },
        ],
      },
    ],
  },
};

export function getNicheConfig(businessId?: string) {
  if (!businessId) return niches.default;
  return niches[businessId] ?? niches.default;
}
