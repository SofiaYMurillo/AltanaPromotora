import type { FaqData } from "./faq.types";

const faqItems = [
  {
    id: "faq-info-property",
    question: "¿Cómo puedo obtener más información sobre una propiedad?",
    answer:
      "En nuestro portafolio encontrarás información sobre cada propiedad, como sus características, ubicación y disponibilidad. Si quieres conocer algún detalle adicional, estaremos disponibles para ayudarte.",
  },
  {
    id: "faq-rent-requirements",
    question: "¿Qué requisitos necesito para arrendar una propiedad?",
    answer:
      "Los requisitos pueden variar según la propiedad y las condiciones del arrendamiento. Generalmente se solicita documentación personal y soportes que permitan realizar el proceso de manera adecuada. Nuestro equipo puede orientarte sobre los documentos necesarios para tu caso.",
  },
  {
    id: "faq-before-rent",
    question: "¿Qué información debo tener en cuenta antes de arrendar?",
    answer:
      "Antes de elegir una propiedad, es importante conocer su ubicación, características, condiciones de arrendamiento y disponibilidad. Así podrás encontrar una opción que se ajuste mejor a lo que estás buscando.",
  },
  {
    id: "faq-property-types",
    question: "¿Qué tipo de propiedades oferece Altana Promotora?",
    answer:
      "Altana Promotora ofrece diferentes propiedades y espacios inmobiliarios disponibles para arrendamiento. Nuestro objetivo es brindar opciones que se adapten a las necesidades de quienes buscan un lugar adecuado para vivir.",
  },
  {
    id: "faq-visit",
    question: "¿Puedo visitar la propiedad antes de tomar una decisión?",
    answer:
      "Sí. Queremos que conozcas el espacio antes de elegirlo, por eso puedes solicitar una visita y recorrer la propiedad personalmente.",
  },
  {
    id: "faq-contact",
    question: "¿Cómo puedo comunicarme con Altana Promotora?",
    answer:
      "Puedes encontrarnos a través de los medios de contacto disponibles en nuestra página web. Será un gusto escucharte, resolver tus inquietudes y ayudarte a encontrar la opción que buscas.",
  },
] as const;

export const faqData: FaqData = {
  title: "Preguntas frecuentes",
  description:
    "Encuentre respuestas detalladas sobre nuestro proceso de adquisición, opciones de financiación personalizadas y los exclusivos servicios de diseño para su próxima residencia.",
  blocks: [
    {
      id: "faq-block-1",
      items: [faqItems[0], faqItems[1], faqItems[2]],
    },
    {
      id: "faq-block-2",
      items: [faqItems[3], faqItems[4], faqItems[5]],
    },
  ],
};
