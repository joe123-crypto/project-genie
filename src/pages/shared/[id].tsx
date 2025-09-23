import { GetServerSideProps } from 'next';
import Head from 'next/head';
import React from 'react';

interface SharedImageProps {
  id: string;
  imageUrl: string;
  filterName: string;
  username?: string | null;
  notFound?: boolean;
}

const SharedImageView: React.FC<SharedImageProps> = ({ imageUrl, filterName, username, notFound }) => {
  if (notFound) {
    return <div className="max-w-2xl mx-auto text-center mt-20">Image not found.</div>;
  }
  return (
    <>
      <Head>
        <title>Shared Image - {filterName}</title>
        <meta property="og:title" content={`Image created with the '${filterName}' filter`} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:description" content={`Check out this image created with the '${filterName}' filter on Genie!`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Image created with the '${filterName}' filter`} />
        <meta name="twitter:image" content={imageUrl} />
        <meta name="twitter:description" content={`Check out this image created with the '${filterName}' filter on Genie!`} />
      </Head>
      <div className="max-w-2xl mx-auto animate-fade-in text-center mt-10">
        <div className="bg-base-200 dark:bg-dark-base-200 p-4 sm:p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-content-100 dark:text-dark-content-100">
            Image created with the &quot;{filterName}&quot; filter
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
            />
          </div>
          <a
            href={imageUrl}
            download={`shared-${filterName.replace(/\s/g, '-')}-${Date.now()}.png`}
            className="w-full sm:w-auto bg-brand-primary hover:bg-brand-secondary dark:bg-dark-brand-primary dark:hover:bg-dark-brand-secondary text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg"
          >
            Download Image
          </a>
        </div>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.query;
  if (!id || typeof id !== 'string') {
    return { props: { notFound: true } };
  }
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://${context.req.headers.host}`;
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
      username: data.username || null,
      notFound: false,
    },
  };
};

export default SharedImageView; 