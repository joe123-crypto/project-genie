
import { Metadata } from "next";
import Link from "next/link";
import React from "react";
import { initializeFirebaseAdmin } from "@/lib/firebaseAdmin";

// -------------------------------
// 1. Define Page Props
// -------------------------------
type SharedPageProps = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

// -------------------------------
// 2. Define Component Props
// -------------------------------
interface SharedImageProps {
  id: string;
  imageUrl: string;
  filterName: string;
  filterId?: string;
  username?: string | null;
  notFound?: boolean;
}

// -------------------------------
// 3. Fetch shared image data
// -------------------------------
async function getSharedImage(id: string): Promise<SharedImageProps> {
  const admin = initializeFirebaseAdmin();
  const db = admin.firestore();
  try {
    const doc = await db.collection("sharedImages").doc(id).get();
    if (!doc.exists) {
      return { id, notFound: true, imageUrl: "", filterName: "" };
    }
    const data = doc.data();
    if (!data || !data.imageUrl) {
      return { id, notFound: true, imageUrl: "", filterName: "" };
    }
    return {
      id,
      imageUrl: data.imageUrl,
      filterName: data.filterName,
      filterId: data.filterId || null,
      username: data.username || null,
      notFound: false,
    };
  } catch (error) {
    console.error("SSR Firestore fetch failed for shared image:", error);
    return { id, notFound: true, imageUrl: "", filterName: "" };
  }
}

// -------------------------------
// 4. Generate Page Metadata
// -------------------------------
export async function generateMetadata({ params }: {params : any}): Promise<Metadata> {
  const { id } = params;
  const { imageUrl, filterName, username } = await getSharedImage(id);
  const absoluteUrl = `https://project-genie-sigma.vercel.app/shared/${id}`;
  const finalImage = imageUrl || "https://project-genie-sigma.vercel.app/og-image.png";
  const pageTitle = filterName ? `Genie | ${filterName}` : "Genie";
  const description = `Check out this image created with the '${filterName}' filter on Genie!`;
  const ogTitle = filterName ? `Created with '${filterName}' filter` : "AI Filters That Work Like Magic";
  const ogDescription = `Check out this image created on Genie${username ? ` by ${username}` : ""}`;

  return {
    title: pageTitle,
    description: description,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: absoluteUrl,
      siteName: "Genie",
      type: "website",
      images: [{
        url: finalImage,
        secureUrl: finalImage,
        width: 1200,
        height: 630,
        alt: `Image created with the '${filterName}' filter`,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [finalImage],
    },
    metadataBase: new URL("https://project-genie-sigma.vercel.app"),
    alternates: {
      canonical: absoluteUrl,
    },
  };
}

// -------------------------------
// 5. Component UI
// -------------------------------
const SharedImageView: React.FC<SharedImageProps> = ({
  id,
  imageUrl,
  filterName,
  filterId,
  username,
  notFound,
}) => {
  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto text-center mt-20 text-content-100 dark:text-dark-content-100">
        Image not found.
      </div>
    );
  }

  const shareUrl = `https://project-genie-sigma.vercel.app/shared/${id}`;
  const shareText = `Check out this image created with the '${filterName}' filter on Genie!`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in text-center mt-10">
      <div className="bg-base-200 dark:bg-dark-base-200 p-4 sm:p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-content-100 dark:text-dark-content-100">
          Image created with &quot;{filterName}&quot;
        </h2>
        {username && <p className="text-content-200 dark:text-dark-content-200 mt-2">Shared by {username}</p>}
        <div className="my-6 w-full aspect-square bg-base-300 dark:bg-dark-base-300 rounded-lg flex items-center justify-center overflow-hidden">
          <img src={imageUrl} alt={`Image created with ${filterName} filter`} className="object-contain w-full h-full" loading="eager" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={filterId ? `/apply/${filterId}` : "/"} className="w-full sm:w-auto bg-green-200 hover:bg-green-300 dark:bg-green-800 dark:hover:bg-green-700 text-green-900 dark:text-green-100 font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg">
            Create Your Own
          </Link>
          <Link href="/" className="w-full sm:w-auto bg-neutral-200 hover:bg-neutral-300 dark:bg-dark-neutral-200 dark:hover:bg-dark-neutral-300 text-content-100 dark:text-dark-content-100 font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg">
            Go Back To Marketplace
          </Link>
        </div>
        <div className="mt-8 border-t border-base-300 dark:border-dark-base-300 pt-6">
          <p className="text-content-200 dark:text-dark-content-200 mb-3 font-semibold">Share this creation</p>
          <div className="flex justify-center gap-4">
            <a href={twitterShareUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#1DA1F2] hover:bg-[#0c85d0] text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 shadow-lg">
              <span>Share on X</span>
            </a>
            <a href={linkedinShareUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#0A66C2] hover:bg-[#004182] text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 shadow-lg">
              <span>Share on LinkedIn</span>
            </a>
            <a href={whatsappShareUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 shadow-lg">
              <span>Share on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------
// 6. Page Entry Point
// -------------------------------
export default async function SharedImagePage({ params }: {params : any}) {
  const props = await getSharedImage(params.id);
  return <SharedImageView {...props} />;
}
