export const defaultSeoMetadata = {
  title: "Aleya · Grow whole, not in fragments",
  description:
    "Aleya braids reflection, companionship, and gentle accountability so each note of care, habit, and rest can bloom together beneath a steady light.",
  url: "https://aleya.dodon.in",
  image:
    "https://opengraph.b-cdn.net/production/images/f4380101-5605-4121-9237-523a6baf4479.jpg?token=wS88QG0LZOMnH_GWiDo2jNt4zZhdRvpZKYAT0xHcdyE&height=800&width=1200&expires=33294371700",
  twitterCard: "summary_large_image",
  twitterDomain: "aleya.dodon.in",
};

const ensureMetaTag = (attributes, content) => {
  const selector = Object.entries(attributes)
    .map(([key, value]) => `[${key}="${value}"]`)
    .join("");

  let element = document.head.querySelector(`meta${selector}`);

  if (!element) {
    element = document.createElement("meta");
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
};

export const applyDefaultSeo = () => {
  if (typeof document === "undefined") {
    return;
  }

  const { title, description, url, image, twitterCard, twitterDomain } = defaultSeoMetadata;

  if (title) {
    document.title = title;
  }

  if (description) {
    ensureMetaTag({ name: "description" }, description);
  }

  if (url) {
    ensureMetaTag({ property: "og:url" }, url);
    ensureMetaTag({ property: "twitter:url" }, url);
  }

  if (image) {
    ensureMetaTag({ property: "og:image" }, image);
    ensureMetaTag({ name: "twitter:image" }, image);
  }

  ensureMetaTag({ property: "og:type" }, "website");

  if (title) {
    ensureMetaTag({ property: "og:title" }, title);
    ensureMetaTag({ name: "twitter:title" }, title);
  }

  if (description) {
    ensureMetaTag({ property: "og:description" }, description);
    ensureMetaTag({ name: "twitter:description" }, description);
  }

  ensureMetaTag({ name: "twitter:card" }, twitterCard || "summary_large_image");

  if (twitterDomain) {
    ensureMetaTag({ property: "twitter:domain" }, twitterDomain);
  }
};
