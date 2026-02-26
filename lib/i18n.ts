export const translations = {
  fr: {
    about: {
      title: "À propos de Soajery",
      intro1: "Nous sommes un acteur indépendant du foncier à Madagascar, avant tout issu de l’expérience du terrain.",
      intro2: "Au fil des années, nous avons acheté, vendu et géré plusieurs terrains, principalement à Antananarivo et dans ses environs. Comme beaucoup, nous avons fait face aux réalités du foncier malgache : procédures complexes, informations contradictoires, risques juridiques, lenteurs administratives… mais aussi de bonnes opportunités lorsqu’on est bien informé.",
      intro3: "C’est à partir de ces expériences concrètes que nous avons décidé de partager, expliquer et sensibiliser.",
      shareTitle: "À travers notre page Facebook et notre site web dédiée au foncier à Madagascar, nous partageons :",
      shareList: [
        "des retours d’expérience réels,",
        "des leçons tirées de réussites comme d’erreurs,",
        "des conseils pratiques basés sur ce que nous avons vécu,",
        "des explications simples sur les démarches foncières (titre, bornage, mutation, etc.).",
      ],
      sales: "En parallèle, nous proposons à la vente des terrains que nous connaissons directement, situés à Antananarivo et alentours, avec une priorité donnée à la clarté de la situation foncière et à la transparence vis-à-vis des acheteurs.",
      objectiveTitle: "Notre objectif n’est pas de promettre l’impossible, mais de :",
      objectiveList: [
        "👉 partager une expérience utile,",
        "👉 aider à éviter les erreurs courantes,",
        "👉 favoriser des transactions foncières plus sûres et plus réfléchies à Madagascar.",
      ],
    },
    stats: {
      lotissements: "Lotissements",
      clients: "Clients",
      years: "Ans d’expérience",
      lotissementsDesc: "Des opportunités sélectionnées.",
      clientsDesc: "Une expérience de terrain.",
      yearsDesc: "Une expertise reconnue.",
    },
  },
  mg: {
    about: {
      title: "Iza moa izahay?",
      intro1: "Izahay dia mpisehatra mahaleo tena eo amin’ny sehatry ny raharaham-tany eto Madagasikara, niainga tamin’ny traikefa azo.",
      intro2: "Nandritra ny taona maro, dia nividy, nivarotra ary nitantana tany maro izahay, teto Antananarivo sy ny manodidina. Tahaka ny maro dia niatrika fahasarotana :",
      intro2List: [
        "👉🏼Tsy fahafantarana sy ny tsy fahaizana ny dingana tokony aleha",
        "👉🏼fahataran’ny raharaham-panjakana",
      ],
      intro3: "Avy amin’ireo traikefa tena niainana ireo no nanapahanay hevitra ny hizara, hanazava ary hampahafantatra, amin’ny alalan’ny pejy Facebook sy ny tranokalan'i Soajery:",
      shareList: [
        "👉🏼traikefa tena nisy",
        "👉🏼lesona azo avy amin’ny fahombiazana sy ny fahadisoana,",
        "👉🏼torohevitra azo ampiharina, mifototra amin’izay tena niainanay,",
        "👉🏼fanazavana tsotra momba ny dingana ara-tany (titre, bornage, mutation, sns).",
      ],
      sales: "Ankoatra izany, manolotra tany amidy izahay, izay fantatray mivantana eto Antananarivo sy ny manodidina, ka laharam-pahamehana ny fahazavan’ny taratasy, ny fahamarinana sy mangarahara ho an’ireo mpividy.",
      objectiveTitle: "Ny tanjany tsy manome teny diso fa:",
      objectiveList: [
        "👉 mizara traikefa manan-danja,",
        "👉 manampy amin’ny fandrahoanana ny fahadisoana matetika,",
        "👉 manatsara sy mamorona varotra ara-tany mihoatra azo antoka sy mierim-poto eto Madagasikara.",
      ],
    },
    stats: {
      lotissements: "Tany",
      clients: "Mpanjifa",
      years: "Taona traikefa",
      lotissementsDesc: "Fahafahana voafidy.",
      clientsDesc: "Traikefa amin’ny tany.",
      yearsDesc: "Fahaizana azo tsapain-tanana.",
    },
  },
} as const

export type Lang = keyof typeof translations

export function useTranslation(lang: Lang) {
  return translations[lang]
}
