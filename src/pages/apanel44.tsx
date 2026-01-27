/**
 * Dashboard Page for SMP Admin Panel
 * Redirects to /apanel44/dashboard
 */

import { GetServerSideProps } from 'next';

export default function ApanelIndex() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/apanel44/dashboard',
      permanent: true,
    },
  };
};
