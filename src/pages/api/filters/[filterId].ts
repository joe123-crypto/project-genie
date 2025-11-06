import { NextApiRequest, NextApiResponse } from 'next';
import { firestoreAdmin } from '../../../lib/firestoreAdmin';
import { Filter } from '../../../types';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { filterId } = req.query;

    if (req.method === 'GET') {
      if (typeof filterId !== 'string') {
        return res.status(400).json({ error: 'Invalid filter ID' });
      }
      
      const filterDoc = await firestoreAdmin.collection('filters').doc(filterId).get();

      if (!filterDoc.exists) {
        return res.status(404).json({ error: 'Filter not found' });
      }

      const filterData = filterDoc.data() as Filter;
      res.status(200).json({ ...filterData, id: filterDoc.id });

    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error: any) {
    console.error('Error fetching filter:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;
