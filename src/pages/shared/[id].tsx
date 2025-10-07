import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import React from "react";

interface SharedImageProps {
  id: string;
  imageUrl: string;
  filterName: string;
  filterId?: string;
  username?: string | null;
  notFound?: boolean;
}

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

  const absoluteUrl = `https://project-genie-sigma.vercel.app/shared/${id}`;
  const mimeType = imageUrl.endsWith(".webp") ? "image/webp" : "image/png";

  return (
    <>
      <Head>
        {/* ✅ SEO + Social Sharing Metadata */}
        <title>{`Genie | ${filterName}`}</title>
        <meta
          name="description"
          content={`Check out this image created with the '${filterName}' filter on Genie!`}
        />

        {/* ✅ Open Graph tags for WhatsApp / Facebook / Discord */}
        <meta property="og:title" content={`Created with '${filterName}' filter`} />
        <meta
          property="og:description"
          content={`Check out this image created on Genie${
            username ? ` by ${username}` : ""
          }!`}
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={absoluteUrl} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:image:type" content={mimeType} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* ✅ Twitter Card (optional but good for consistency) */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Created with '${filterName}' filter`} />
        <meta
          name="twitter:description"
          content={`Check out this image created on Genie!`}
        />
        <meta name="twitter:image" content={imageUrl} />

        {/* ✅ Extra fallback for WhatsApp crawler */}
        <meta property="og:site_name" content="Genie" />
        <meta property="og:locale" content="en_US" />
      </Head>

      <div className="max-w-2xl mx-auto animate-fade-in text-center mt-10">
        <div className="bg-base-200 dark:bg-dark-base-200 p-4 sm:p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-content-100 dark:text-dark-content-100">
            Image created with &quot;{filterName}&quot;
          </h2>
          {username && (
            <p className="text-content-200 dark:text-dark-content-200 mt-2">
              Shared by {username}
            </p>
          )}

          <div className="my-6 w-full aspect-square bg-base-300 dark:bg-dark-base-300 rounded-lg flex items-center justify-center overflow-hidden">
            <img
              src={imageUrl}
              alt={`Image created with ${filterName} filter`}
              className="object-contain w-full h-full"
              loading="eager"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {/* ✅ Create Your Own button */}
            <Link
              href={filterId ? `/apply/${filterId}` : "/"}
              className="w-full sm:w-auto bg-green-200 hover:bg-green-300 dark:bg-green-800 dark:hover:bg-green-700 text-green-900 dark:text-green-100 font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg"
            >
              Create Your Own
            </Link>

            {/* ✅ Go Back To Marketplace button */}
            <Link
              href="/"
              className="w-full sm:w-auto bg-neutral-200 hover:bg-neutral-300 dark:bg-dark-neutral-200 dark:hover:bg-dark-neutral-300 text-content-100 dark:text-dark-content-100 font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg"
            >
              Go Back To Marketplace
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

// ✅ SERVER-SIDE: fully resolves data before HTML render
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.query;
  if (!id || typeof id !== "string") {
    return { props: { notFound: true } };
  }

  // Force HTTPS to ensure crawlers can access
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    `https://${context.req.headers.host}`;

  try {
    const res = await fetch(`${baseUrl}/api/share?id=${id}`);
    if (!res.ok) {
      return { props: { notFound: true } };
    }

    const data = await res.json();

    return {
      props: {
        id,
        imageUrl: data.imageUrl,
        filterName: data.filterName,
        filterId: data.filterId || null,
        username: data.username || null,
        notFound: false,
      },
    };
  } catch (error) {
    console.error("SSR fetch failed for shared image:", error);
    return { props: { notFound: true } };
  }
};

export default SharedImageView;
