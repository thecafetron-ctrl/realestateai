"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Album,
  ArrowLeftRight,
  Copy,
  FilePlus,
  Images,
  Loader2,
  Megaphone,
  Palette,
  RefreshCw,
  Save,
  Sparkles,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import { useSampleMode } from "@/components/sample-mode-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const blankProperty = {
  title: "",
  address: "",
  price: "",
  bedrooms: 3,
  bathrooms: 3,
  area: "",
  description: "",
  highlights: [] as string[],
  image: "",
  url: "",
};

type MarketingAsset = {
  id: string;
  content_type: "instagramCaption" | "listingVideoScript" | "blogPost" | "adHeadline";
  listing_details: string;
  generated_text: string;
  created_at: string;
};

type GeneratedBundle = {
  instagram: string;
  video: string;
  blog: string;
  headline: string;
};

const labelMap: Record<MarketingAsset["content_type"], string> = {
  instagramCaption: "Instagram caption",
  listingVideoScript: "Listing video script",
  blogPost: "Blog post",
  adHeadline: "Ad headline",
};

const fetchMarketing = async (): Promise<MarketingAsset[]> => {
  const response = await fetch("/api/marketing");
  if (!response.ok) {
    throw new Error("Unable to load marketing content");
  }
  const data = (await response.json()) as { content: MarketingAsset[] };
  return data.content;
};

const buildBundle = (property: typeof blankProperty): GeneratedBundle => {
  if (!property.title) {
    return {
      instagram: "Share a luxury listing by adding property details.",
      video: "Introduce the property with cinematic hooks once details are loaded.",
      blog: "Provide highlights to unlock the AI blog narrative.",
      headline: "Add price and features to craft punchy headlines.",
    };
  }

  const primaryHighlight = property.highlights[0] || "Grand entertaining core with seamless indoor and outdoor flow";
  const secondaryHighlight = property.highlights[1] || "Culinary kitchen with designer appliances";
  const tertiaryHighlight = property.highlights[2] || "Wellness pavilion with spa suite";
  const quaternaryHighlight = property.highlights[3] || "Resort inspired poolscape with cabanas";
  const descriptionLine = property.description || "An architect curated residence with horizon views and resort level amenities.";
  const headlinePricePrefix = property.price ? property.price + " - " : "";
  const base = `${property.title} • ${property.address}\n${property.price || "Private price on request"}`;

  const instagram =
    base +
    "\n\n" +
    `Step inside ${property.bedrooms}-bed / ${property.bathrooms}-bath sanctuary with ${primaryHighlight}.` +
    "\n\n" +
    `DM "TOUR" for a private showing. #LuxuryRealEstate #${(property.address.split(",")[0] || "DreamHome").replace(/[^A-Za-z]/g, "")}`;

  const videoLines = [
    `Opening shot: sweeping exterior of ${property.title}.`,
    "",
    `Voiceover: "Welcome to ${property.address}, where ${descriptionLine}."`,
    "",
    "Scene list:",
    "1. Arrival courtyard with valet ready porte cochere.",
    `2. Great room showing ${primaryHighlight}.`,
    "3. Primary retreat with spa bath and dressing lounge.",
    "4. Sunset reveal of the outdoor experience with infinity edge pool.",
    "",
    "Call to action: " + '"Book your private twilight tour with the Luxe Concierge team."',
  ];

  const video = videoLines.join("\n");

  const blogLines = [
    `## ${property.title}`,
    descriptionLine,
    "",
    "**Highlights**",
    `- ${primaryHighlight}`,
    `- ${secondaryHighlight}`,
    `- ${tertiaryHighlight}`,
    `- ${quaternaryHighlight}`,
    "",
    "**Details**",
    `- Bedrooms: ${property.bedrooms}`,
    `- Bathrooms: ${property.bathrooms}`,
  ];

  if (property.area) {
    blogLines.push(`- Area: ${property.area}`);
  }
  blogLines.push(property.price ? `Offered at ${property.price}.` : "Pricing available on request.");

  const blog = blogLines.join("\n");
  const headline = `${headlinePricePrefix}${property.title || "Signature Residence"} - Private Tours Now Open`;

  return { instagram, video, blog, headline };
};

export default function MarketingPage() {
  const queryClient = useQueryClient();
  const {
    isSampleMode,
    posts,
    addMarketingAsset,
    removeMarketingAsset,
    propertyLibrary,
    randomizeProperty,
    activeProperty,
    setActiveProperty,
    addNotification,
  } = useSampleMode();

  const { data: storedContent, isLoading } = useQuery({
    queryKey: ["marketing-content"],
    queryFn: fetchMarketing,
    enabled: !isSampleMode,
  });

  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [property, setProperty] = useState(() => ({ ...blankProperty, ...(activeProperty ?? {}) }));
  const [bundle, setBundle] = useState<GeneratedBundle>(() => buildBundle(property));
  const [heroImage, setHeroImage] = useState<string>(property.image ?? "");
  const [pastedUrl, setPastedUrl] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);

  useEffect(() => {
    setBundle(buildBundle(property));
  }, [property]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!property.title) {
        throw new Error("Add property details first");
      }

      if (isSampleMode) {
        const content = buildBundle(property);
        addMarketingAsset({
          platform: "Instagram",
          title: property.title,
          caption: content.instagram,
          hashtags: "#LuxuryListing #AIConcierge",
        });
        setBundle(content);
        toast.success("Sample assets refreshed", { description: `${property.title} is social-ready.` });
        return null;
      }

      const response = await fetch("/api/ai/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "instagramCaption", details: `${property.title} ${property.description}` }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Generation failed");
      }
      return (await response.json()) as { content: MarketingAsset };
    },
    onSuccess: (result) => {
      if (!result) {
        return;
      }
      toast.success("Marketing asset saved", { description: "Stored to Supabase library." });
      queryClient.invalidateQueries({ queryKey: ["marketing-content"] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error("Unable to generate content", { description: message });
    },
  });

  const library = useMemo(() => {
    if (isSampleMode) {
      return posts.map((post, index) => ({
        id: `sample-post-${index}`,
        content_type: post.platform === "Instagram" ? "instagramCaption" : "blogPost",
        listing_details: post.title,
        generated_text: `${post.caption}\n\n${post.hashtags}`,
        created_at: new Date(Date.now() - index * 90_000).toISOString(),
        platform: post.platform,
      }));
    }
    return storedContent ?? [];
  }, [isSampleMode, posts, storedContent]);

  const handleInsertSampleProperty = () => {
    const sample = randomizeProperty();
    if (!sample) return;
    setActiveProperty(sample.id);
    setProperty({
      title: sample.title,
      address: sample.address,
      price: sample.price,
      bedrooms: sample.bedrooms,
      bathrooms: sample.bathrooms,
      area: sample.area,
      description: sample.description,
      highlights: sample.highlights,
      image: sample.image,
      url: sample.url,
    });
    setHeroImage(sample.image);
    setPastedUrl(sample.url);
    addNotification({ title: "Sample property loaded", detail: `${sample.title} synced to marketing.` });
  };

  const handleUrlPaste = (value: string) => {
    setPastedUrl(value);
    if (!value) return;
    const sample = propertyLibrary.find((item) => value.includes(item.url.split("/").pop() ?? "")) ?? propertyLibrary[0];
    if (sample) {
      setProperty({
        title: sample.title,
        address: sample.address,
        price: sample.price,
        bedrooms: sample.bedrooms,
        bathrooms: sample.bathrooms,
        area: sample.area,
        description: sample.description,
        highlights: sample.highlights,
        image: sample.image,
        url: value,
      });
      setHeroImage(sample.image);
      toast.success("Property details extracted", { description: `${sample.title} synced for content.` });
    }
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files || !files.length) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.toString() ?? "";
      setHeroImage(result);
    };
    reader.readAsDataURL(file);
    toast.success("Image staged", { description: `${file.name} ready for the preview deck.` });
  };

  const generateImageMutation = useMutation({
    mutationFn: async () => {
      if (!property.title) {
        throw new Error("Add property details first");
      }
      setGeneratingImage(true);
      try {
        if (isSampleMode) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          const sampleImage = propertyLibrary[Math.floor(Math.random() * propertyLibrary.length)]?.image || property.image || "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80";
          setHeroImage(sampleImage);
          setProperty((prev) => ({ ...prev, image: sampleImage }));
          toast.success("Image generated", { description: "AI-generated property image ready." });
          return sampleImage;
        }
        const response = await fetch("/api/ai/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyDetails: {
              title: property.title,
              address: property.address,
              bedrooms: property.bedrooms,
              bathrooms: property.bathrooms,
              description: property.description,
              highlights: property.highlights,
              price: property.price,
            },
          }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error ?? "Image generation failed");
        }
        const payload = (await response.json()) as { imageUrl: string };
        setHeroImage(payload.imageUrl);
        setProperty((prev) => ({ ...prev, image: payload.imageUrl }));
        toast.success("Image generated", { description: "AI-generated property image ready." });
        return payload.imageUrl;
      } finally {
        setGeneratingImage(false);
      }
    },
    onError: (error: unknown) => {
      setGeneratingImage(false);
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error("Unable to generate image", { description: message });
    },
  });

  const handleRemoveAsset = (id: string, title: string) => {
    if (isSampleMode) {
      removeMarketingAsset(title);
      toast("Asset archived", { description: `${title} removed from the demo library.` });
      return;
    }
    // For live mode we simply notify; implementing Supabase deletion could follow later.
    toast.info("Use Supabase dashboard", { description: "Delete live assets directly from storage for now." });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-text-primary bg-clip-text text-transparent premium-gradient">Marketing Studio</h1>
          <p className="text-sm text-text-tertiary mt-2">
            Instantly craft social, video, blog, and ad campaigns from a single luxury property brief.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="rounded-2xl border-purple-500/30 bg-surface-dark/50 hover:bg-surface-medium"
            onClick={handleInsertSampleProperty}
          >
            <Sparkles className="mr-2 h-4 w-4 text-purple-400" /> Insert Sample Property
          </Button>
          <Button
            variant="ghost"
            className="rounded-2xl border border-purple-500/20 hover:bg-surface-medium"
            onClick={() => {
              setProperty(blankProperty);
              setHeroImage("");
              setPastedUrl("");
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Clear Brief
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px,1fr]">
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-emerald-500/10" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2 text-lg text-text-primary">
              <Megaphone className="h-5 w-5 text-purple-400" /> Property brief
            </CardTitle>
            <CardDescription className="text-text-tertiary">
              Paste a property link, drop a hero image, and the AI will craft multi-channel creatives.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <div className="space-y-2">
              <Label>Property URL</Label>
              <Input
                value={pastedUrl}
                onChange={(event) => handleUrlPaste(event.target.value)}
                placeholder="https://www.zillow.com/…"
                className=""
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Listing title</Label>
                <Input
                  value={property.title}
                  onChange={(event) => setProperty((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Glasshouse Estate Over Zilker"
                  className="rounded-2xl border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-800/70"
                />
              </div>
              <div className="space-y-2">
                <Label>Price / offer</Label>
                <Input
                  value={property.price}
                  onChange={(event) => setProperty((prev) => ({ ...prev, price: event.target.value }))}
                  placeholder="$2,480,000"
                  className="rounded-2xl border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-800/70"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={property.address}
                onChange={(event) => setProperty((prev) => ({ ...prev, address: event.target.value }))}
                placeholder="721 Willow Drive, Austin, TX"
                className="rounded-2xl border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-800/70"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Beds</Label>
                <Input
                  value={property.bedrooms}
                  onChange={(event) => setProperty((prev) => ({ ...prev, bedrooms: Number(event.target.value) || 0 }))}
                  className="rounded-2xl border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-800/70"
                />
              </div>
              <div className="space-y-2">
                <Label>Baths</Label>
                <Input
                  value={property.bathrooms}
                  onChange={(event) => setProperty((prev) => ({ ...prev, bathrooms: Number(event.target.value) || 0 }))}
                  className="rounded-2xl border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-800/70"
                />
              </div>
              <div className="space-y-2">
                <Label>Area</Label>
                <Input
                  value={property.area}
                  onChange={(event) => setProperty((prev) => ({ ...prev, area: event.target.value }))}
                  placeholder="3,950 sq ft"
                  className="rounded-2xl border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-800/70"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Positioning statement</Label>
              <Textarea
                value={property.description}
                onChange={(event) => setProperty((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="An architect-curated sanctuary with horizon views and resort-level amenities."
                className="min-h-[120px] rounded-3xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Highlights (comma separated)</Label>
              <Input
                value={property.highlights.join(", ")}
                onChange={(event) =>
                  setProperty((prev) => ({
                    ...prev,
                    highlights: event.target.value.split(",").map((item) => item.trim()).filter(Boolean),
                  }))
                }
                placeholder="Infinity pool, Poliform kitchen, Wellness pavilion"
                className="rounded-2xl border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-800/70"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-text-primary font-semibold">Hero imagery</Label>
                <Button
                  type="button"
                  variant="gradient"
                  size="sm"
                  onClick={() => generateImageMutation.mutate()}
                  disabled={generateImageMutation.isPending || !property.title}
                  className="rounded-xl font-semibold shadow-purple-glow-sm"
                >
                  {generateImageMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" /> Generate AI Image
                    </>
                  )}
                </Button>
              </div>
              <div
                className="group relative flex h-56 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-purple-500/30 bg-surface-dark/50 text-center text-sm text-text-tertiary transition-all duration-300 hover:border-purple-500/60 hover:bg-surface-medium hover:shadow-purple-glow-sm hover:text-text-secondary"
                onClick={() => uploadInputRef.current?.click()}
              >
                {heroImage ? (
                  <>
                    <Image src={heroImage} alt="Hero" fill className="rounded-3xl object-cover" />
                    <div className="absolute inset-0 rounded-3xl bg-purple-500/10 opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="absolute bottom-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button variant="outline" size="sm" className="premium-gradient border-none text-white shadow-purple-glow-sm" onClick={(e) => {
                        e.stopPropagation();
                        uploadInputRef.current?.click();
                      }}>
                        <Upload className="mr-2 h-4 w-4" /> Replace
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-2xl bg-purple-500/20 p-4 border border-purple-500/30">
                      <Images className="h-8 w-8 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-text-secondary font-medium">Click to upload or drop a photo</p>
                      <p className="text-xs text-text-tertiary mt-1">Or use AI to generate a perfect image</p>
                    </div>
                  </div>
                )}
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleImageUpload(event.target.files)}
                />
              </div>
              {generatingImage && (
                <div className="flex items-center gap-2 rounded-xl bg-purple-500/10 border border-purple-500/30 px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                  <p className="text-sm text-purple-300">AI is generating your property image...</p>
                </div>
              )}
            </div>

            <Button
              variant="gradient"
              className="w-full rounded-3xl py-4 text-base font-bold text-white shadow-purple-glow hover:shadow-purple-glow-sm hover:scale-[1.02] transition-all duration-200"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
              Generate campaign bundle
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader className="flex flex-col gap-2">
              <CardTitle className="flex items-center gap-2 text-lg text-text-primary">
                <Palette className="h-5 w-5 text-purple-400" /> Campaign bundle
              </CardTitle>
              <CardDescription className="text-text-tertiary">
                Ready-to-deploy copy for every channel. Click to copy and drop into your CRM.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence mode="popLayout">
                {([
                  { label: "Instagram caption", value: bundle.instagram },
                  { label: "Video script", value: bundle.video },
                  { label: "Blog snippet", value: bundle.blog },
                  { label: "Ad headline", value: bundle.headline },
                ] as const).map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.25 }}
                    className="rounded-3xl border border-purple-500/20 bg-surface-dark/50 p-4 shadow-elevation-1"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">{item.label}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-2xl text-text-tertiary hover:text-emerald-400"
                        onClick={() => {
                          navigator.clipboard.writeText(item.value);
                          toast.success("Copied to clipboard", { description: `${item.label} ready to paste.` });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <ScrollArea className="max-h-48 pr-4">
                      <p className="whitespace-pre-wrap text-sm leading-6 text-text-secondary">{item.value}</p>
                    </ScrollArea>
                  </motion.div>
                ))}
              </AnimatePresence>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-2">
              <CardTitle className="flex items-center gap-2 text-lg text-text-primary">
                <Album className="h-5 w-5 text-purple-400" /> Saved creative library
              </CardTitle>
              <CardDescription className="text-text-tertiary">
                Assets generated in this session stay ready-to-demo. Remove anything with a single tap.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSampleMode && library.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-purple-500/30 bg-surface-dark/50 p-8 text-center text-sm text-text-tertiary">
                  Generate your first campaign bundle to populate the library.
                </div>
              ) : null}
              {(!isSampleMode && isLoading) ? (
                <div className="grid grid-cols-1 gap-4">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="h-28 animate-pulse rounded-3xl bg-surface-medium" />
                  ))}
                </div>
              ) : (
                <Tabs defaultValue="all">
                  <TabsList className="rounded-2xl bg-surface-dark/50 border border-purple-500/20">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="instagramCaption">Instagram</TabsTrigger>
                    <TabsTrigger value="listingVideoScript">Video</TabsTrigger>
                    <TabsTrigger value="blogPost">Blog</TabsTrigger>
                  </TabsList>
                  {(["all", "instagramCaption", "listingVideoScript", "blogPost"] as const).map((tab) => (
                    <TabsContent key={tab} value={tab} className="mt-6 space-y-4">
                      <AnimatePresence>
                        {library
                          .filter((item) => tab === "all" || item.content_type === tab)
                          .map((item, index) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.04 }}
                              className="rounded-3xl border border-purple-500/20 bg-surface-dark/50 p-5 shadow-elevation-1 transition hover:scale-[1.01] hover:shadow-purple-glow-sm"
                            >
                              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                <div className="space-y-1">
                                  <p className="text-sm font-semibold text-text-primary">
                                    {"platform" in item ? `${item.platform} · ${item.listing_details}` : `${labelMap[item.content_type]} · ${item.listing_details}`}
                                  </p>
                                  <p className="text-xs text-text-tertiary">
                                    {new Date(item.created_at).toLocaleString()}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-2xl text-text-tertiary hover:text-emerald-400"
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.generated_text);
                                      toast.success("Copied", { description: "Creative copied to clipboard." });
                                    }}
                                  >
                                    <Save className="mr-2 h-4 w-4" /> Copy
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-2xl text-rose-400 hover:bg-rose-500/20"
                                    onClick={() => handleRemoveAsset(item.id, item.listing_details)}
                                  >
                                    <ArrowLeftRight className="mr-2 h-4 w-4" /> Remove
                                  </Button>
                                </div>
                              </div>
                              <ScrollArea className="max-h-40 pr-4">
                                <p className="whitespace-pre-wrap text-sm leading-6 text-text-secondary">{item.generated_text}</p>
                              </ScrollArea>
                            </motion.div>
                          ))}
                      </AnimatePresence>
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2">
          <CardTitle className="flex items-center gap-2 text-lg text-text-primary">
            <FilePlus className="h-5 w-5 text-purple-400" /> Team handoff deck
          </CardTitle>
          <CardDescription className="text-text-tertiary">
            Download-ready talking points for your media, concierge, and sales teams.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Media kit", description: "Photo selects, drone agenda, vertical video outline" },
              { title: "Concierge scripts", description: "Follow-up SMS, voicemail, and nurture drip" },
              { title: "Paid ads", description: "Meta copy, Google headlines, callout extensions" },
              { title: "Launch checklist", description: "Open house flow, collateral, launch-day ops" },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-purple-500/20 bg-surface-dark/50 p-5 shadow-elevation-1 transition hover:shadow-purple-glow-sm hover:scale-[1.02]"
              >
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
                  <Upload className="h-4 w-4 text-purple-400" /> {item.title}
                </div>
                <p className="text-sm text-text-tertiary">{item.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


