import { Router } from 'express';
import { validatePolicy } from '../middleware/validatePolicy';
import { createLeadList, getLeadListDetails, importLeads } from '../controllers/leadList.controller';
import { Permission, Resource } from '../types';
import { upload } from '../controllers/campaign.controller';
import { auth } from '../middleware/auth';

const router = Router();
router.use(auth);

router.post(
  '/',
  validatePolicy({
    [Resource.ORG]: {
      [Permission.CREATE]: true,
    },
  }),
  upload,
  createLeadList
);
router.post(
  '/create-lead-entry',
  validatePolicy({
    [Resource.ORG]: {
      [Permission.CREATE]: true,
    },
  }),
  upload,
  importLeads
);

router.get(
  '/:id',
  validatePolicy({
    [Resource.ORG]: {
      [Permission.CREATE]: true,
    },
  }),
  getLeadListDetails
);

// Add these new routes to your existing routes
router.post('/mapping-suggestions', upload.single('csv_file'), leadListController.getMappingSuggestions);
router.post('/process-leads', upload.single('csv_file'), leadListController.processLeadsWithMapping);

export default router;