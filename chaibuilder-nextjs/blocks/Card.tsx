import { registerChaiBlock } from "@chaibuilder/runtime";
import { SingleLineText } from "@chaibuilder/runtime/controls";

// Define the Card component with destructured props
const Card = ({ blockProps, link, posterUrl, m_title, date, place, overlayed }: any) => {
  // If Overlayed is "yes", add opacity-50
  const boxClass = overlayed === "yes" ? "w-full max-w-xs overflow-hidden rounded-lg bg-white shadow-lg opacity-50" : "w-full max-w-xs overflow-hidden rounded-lg bg-white shadow-lg";
  return (
    <a href={link} target="_blank" className="" {...blockProps}>
      <div className={boxClass}>
        <img
          className="h-56 w-full object-cover xl:h-[400px]"
          src={posterUrl}
          alt="Card Image"
          loading="lazy"
          height=""
          width=""
        />
        <div className="py-5 text-center xl:py-[30px]">
          <span
            className="block text-2xl font-bold text-gray-800 xl:text-[20px]"
            data-ai-key="content"
          >
            {m_title}
          </span>
          <span className="block" data-ai-key="content">
            {date}
          </span>
          <span
            className="text-sm text-gray-700"
            data-ai-key="content"
          >
            📍 {place}
          </span>
        </div>
      </div>
    </a>
  );
};

// Register the Card component with ChaiBuilder
registerChaiBlock(Card, {
  type: "Card",
  label: "Card",
  group: "custom",
  category: "core",
  props: {
    link: SingleLineText({ title: "Link", default: "#" }),
    posterUrl: SingleLineText({
      title: "Poster URL",
      default:
        "https://images.unsplash.com/photo-1680868543815-b8666dba60f7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdl...nDB8fHx8&auto=format&fit=crop&w=320&q=80",
    }),
    m_title: SingleLineText({ title: "Title", default: "Card title" }),
    date: SingleLineText({ title: "Date", default: "Date goes here" }),
    place: SingleLineText({ title: "Place", default: "Place goes here" }),
    overlayed: SingleLineText({ title: "Overlayed", default: "" }),
  },
});