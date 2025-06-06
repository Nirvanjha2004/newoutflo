import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import stringSimilarity from 'string-similarity';
import { LeadEntry } from '../entity/LeadEntry';
import { AppDataSource } from '../db';
import { LeadList } from '../entity/LeadList';
import csvParser from 'csv-parser';
import { createReadStream } from 'fs';
import multer from 'multer';

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Create storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// Export multer instance for route handlers
export const uploadCSV = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept CSV files only
    if (file.mimetype === 'text/csv' ||
      file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// Helper function to upload file to storage (S3, etc)
const uploadToStorage = async (file: Express.Multer.File) => {
  try {
    // For now, just return a local path as we don't have S3 configured
    // In production, implement actual S3 upload using AWS SDK
    const fileName = path.basename(file.path);
    logger.info(`File ${fileName} stored successfully in local uploads directory`);
    return `http://localhost:8000/uploads/${fileName}`;
  } catch (error) {
    logger.error('Error uploading file to storage:', error);
    throw new Error('Failed to upload file to storage');
  }
};

export const createLeadList = async (req: Request, res: Response) => {
  try {
    const orgId = req.orgId;

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'No file uploaded',
      });
    }

    const uploadedFile = req.files[0];
    let fileContent = fs.readFileSync(uploadedFile.path, 'utf8');

    // Remove BOM if present
    if (fileContent.charCodeAt(0) === 0xFEFF) {
      fileContent = fileContent.slice(1);
    }

    let records: Record<string, string>[] = [];

    try {
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (err) {
      logger.error('Failed to parse CSV file', err);
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Failed to parse CSV file',
      });
    }

    if (records.length === 0) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'CSV file is empty or invalid format',
      });
    }

    const headers = Object.keys(records[0]);
    const standardFields = ['profile_url', 'first_name', 'last_name', 'company', 'title'];

    const mappedHeadersRaw = standardFields.map((standardField) => {
      const formatted = standardField.replace(/_/g, ' ').toLowerCase();

      // Exact match
      const exactMatch = headers.find((h) => h.toLowerCase() === standardField);
      if (exactMatch) {
        return {
          standard_header: standardField,
          matched_header: exactMatch,
        };
      }

      // Fuzzy match
      const { bestMatch } = stringSimilarity.findBestMatch(formatted, headers.map(h => h.toLowerCase()));
      if (bestMatch.rating > 0.5) {
        const matchedHeader = headers.find(h => h.toLowerCase() === bestMatch.target);
        return {
          standard_header: standardField,
          matched_header: matchedHeader || null,
        };
      }

      return {
        standard_header: standardField,
        matched_header: null,
      };
    });

    // LinkedIn URL heuristic (only if not already mapped)
    const isLinkedInUrl = (val: string) =>
      typeof val === 'string' && val.includes('linkedin.com/in/');

    const profileUrlMapped = mappedHeadersRaw.find(
      (m) => m.standard_header === 'profile_url' && m.matched_header
    );

    if (!profileUrlMapped) {
      for (const header of headers) {
        const hasLinkedIn = records.slice(0, 5).some((row) => isLinkedInUrl(row[header]));
        if (hasLinkedIn) {
          const entry = mappedHeadersRaw.find((m) => m.standard_header === 'profile_url');
          if (entry) {
            entry.matched_header = header;
          }
          break;
        }
      }
    }

    fs.unlinkSync(uploadedFile.path); // Clean up temp file

    return res.status(200).json({
      status: 200,
      data: {
        mappedHeaders: mappedHeadersRaw,
        headers,
      },
      error: null,
    });
  } catch (error) {
    logger.error('Error in createLeadList:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Internal server error',
    });
  }
};

export const importLeads = async (req: Request, res: Response) => {
  const STANDARD_FIELDS = ['profile_url', 'first_name', 'last_name', 'company', 'title'];

  try {
    const orgId = req.orgId;
    const { name, mappedHeaders } = req.body;

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'No file uploaded',
      });
    }

    if (!mappedHeaders || typeof mappedHeaders !== 'string') {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'mappedHeaders must be a non-empty JSON string',
      });
    }

    let rawMappedHeaders: any[];
    try {
      rawMappedHeaders = JSON.parse(mappedHeaders);
    } catch (err) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'mappedHeaders is not valid JSON',
      });
    }

    const uploadedFile = req.files[0];
    let fileContent = fs.readFileSync(uploadedFile.path, 'utf8');

    // Remove BOM if present
    if (fileContent.charCodeAt(0) === 0xfeff) {
      fileContent = fileContent.slice(1);
    }

    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const headerMap: Record<string, string> = {};
    rawMappedHeaders.forEach((h: any) => {
      if (h.matched_header && h.standard_header) {
        headerMap[h.matched_header] = h.standard_header;
      }
    });

    const leadRepo = AppDataSource.getRepository(LeadEntry);
    const leadListRepo = AppDataSource.getRepository(LeadList);

    const newList = leadListRepo.create({
      name,
      totalLeads: records.length,
      orgId,
      campaignIds: [],
      mappedHeaders: rawMappedHeaders,
    });

    const savedList = await leadListRepo.save(newList);

    const leadEntities = records
      .map((row: Record<string, string>) => {
        const entry = new LeadEntry();

        if (!orgId) {
          return null;
        }

        entry.orgId = orgId;
        entry.leadList = savedList;

        const customFields: Record<string, string> = {};

        for (const key in row) {
          const dbField = headerMap[key];
          let value = row[key];

          if (!dbField) continue;

          value = (value ?? '').toString().trim();

          if (dbField === 'profile_url') {
            if (!value) return null;
            entry.profile_url = value;
          } else if (STANDARD_FIELDS.includes(dbField)) {
            (entry as any)[dbField] = value || null;
          } else {
            customFields[dbField] = value;
          }
        }

        if (Object.keys(customFields).length > 0) {
          entry.customFields = customFields;
        }

        return entry.profile_url ? entry : null;
      })
      .filter((entry: LeadEntry | null): entry is LeadEntry => entry !== null);

    await leadRepo.save(leadEntities);

    fs.unlinkSync(uploadedFile.path);

    return res.status(200).json({
      status: 200,
      message: `${leadEntities.length} valid leads imported successfully`,
      leadListId: savedList.id,
    });
  } catch (error: any) {
    console.error('Error importing leads:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: error.message || 'Internal server error',
    });
  }
};

export const getLeadListDetails = async (req: Request, res: Response) => {
  try {
    const leadListId = req.params.id;
    const orgId = req.orgId; // Assuming orgId is set in middleware/auth

    if (!leadListId) {
      return res.status(400).json({
        status: 400,
        error: 'LeadList ID is required',
      });
    }

    const leadListRepo = AppDataSource.getRepository(LeadList);

    // Find the LeadList by id and orgId (security check)
    const leadList = await leadListRepo.findOne({
      where: {
        id: leadListId,
        orgId,
      },
      relations: ['leads'], // optionally include leads if you want
    });

    if (!leadList) {
      return res.status(404).json({
        status: 404,
        error: 'LeadList not found',
      });
    }

    // Return details including mappedHeaders
    return res.status(200).json({
      status: 200,
      data: {
        id: leadList.id,
        name: leadList.name,
        totalLeads: leadList.totalLeads,
        campaignIds: leadList.campaignIds,
        isActive: leadList.isActive,
        mappedHeaders: leadList.mappedHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error fetching lead list details:', error);
    return res.status(500).json({
      status: 500,
      error: error.message || 'Internal server error',
    });
  }
};

export const getMappingSuggestions = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file provided' });
    }

    const csvFile = req.file;
    const results: any[] = [];
    const headers = [];
    let headerRow = true;

    // Parse CSV to get headers and sample rows
    createReadStream(csvFile.path)
      .pipe(csvParser())
      .on('headers', (headerList) => {
        headerList.forEach(header => headers.push(header));
      })
      .on('data', (data) => {
        if (results.length < 5) {
          results.push(data);
        }
      })
      .on('end', () => {
        // Generate mapping suggestions
        const mappings = headers.map(header => {
          const headerLower = header.toLowerCase();
          let mappedType = 'do-not-import';

          // Detect common column names
          if (headerLower.includes('company url')) {
            mappedType = 'company-url'; // Or skip mapping if you don't need it
          } else if (
            (headerLower.includes('linkedin') ||
              (headerLower.includes('url') && !headerLower.includes('company')))
          ) {
            mappedType = 'linkedin-url';
          } else if (
            headerLower === 'first name' ||
            headerLower === 'fname' ||
            headerLower === 'first'
          ) {
            mappedType = 'first-name';
          } else if (
            headerLower === 'last name' ||
            headerLower === 'lname' ||
            headerLower === 'last'
          ) {
            mappedType = 'last-name';
          } else if (headerLower.includes('email')) {
            mappedType = 'email';
          } else if (headerLower.includes('company')) {
            mappedType = 'company';
          } else if (headerLower.includes('position') || headerLower.includes('title')) {
            mappedType = 'job-title';
          } else if (headerLower.includes('location')) {
            mappedType = 'location';
          }
          else if (headerLower.includes('headline') || headerLower.includes('head line')) {
            mappedType = 'head-line';
          } else if (headerLower.includes('tags') || headerLower.includes('tag')) {
            mappedType = 'custom-variable'; // Add phone mapping if needed
          }
          // Get sample values for this column
          const samples = results.map(row => row[header] || '').filter(Boolean);

          return { columnName: header, mappedType, samples };
        });

        // Return mapping suggestions and preview data
        res.json({
          mappings,
          previewData: results,
          totalRows: -1, // You'll need to count total rows or estimate
          headers
        });
      });
  } catch (error) {
    console.error('Error generating mapping suggestions:', error);
    res.status(500).json({ error: error.message });
  }
};

export const processLeadsWithMapping = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file provided' });
    }

    const csvFile = req.file;
    const mappingsJSON = req.body.mappings;

    if (!mappingsJSON) {
      return res.status(400).json({ error: 'No mapping information provided' });
    }

    // Parse mapping information
    const mappingInfo = JSON.parse(mappingsJSON);
    const columnMappings = mappingInfo.columnMappings || [];

    // Create mapping object for easier lookup
    const mappingLookup = {};
    columnMappings.forEach((mapping: { mappedType: string; columnName: string | number; }) => {
      if (mapping.mappedType !== 'do-not-import') {
        mappingLookup[mapping.columnName] = mapping.mappedType;
      }
    });

    // Process the CSV with mappings
    const results: {}[] = [];
    createReadStream(csvFile.path)
      .pipe(csvParser())
      .on('data', (row: { [x: string]: any; }) => {
        const processedRow = {};

        // Apply mappings
        Object.keys(row).forEach(header => {
          const mappedField = mappingLookup[header];
          if (mappedField) {
            // Convert field names from mapping types to your actual entity field names
            const fieldNameMap = {
              'first-name': 'firstName',
              'last-name': 'lastName',
              'linkedin-url': 'linkedinUrl',  // This gets mapped to profile_url in database
              'email': 'email',
              'company': 'company',
              'job-title': 'jobTitle',
              'location': 'location',
              'head-line': 'headLine',
              'custom-variable': 'customVariable', // This can be a JSON object in your entity
              // Add other mappings as needed
            };

            console.log(`Mapping header "${header}" to field "${mappedField}"`);

            const fieldName = fieldNameMap[mappedField] || mappedField;
            processedRow[fieldName] = row[header];
          }
        });

        // Add an ID for each row
        processedRow.id = `lead-${Date.now()}-${results.length}`;

        // Add to results if record has required fields
        if (processedRow.firstName || processedRow.lastName || processedRow.linkedinUrl) {
          results.push(processedRow);
        }
      })
      .on('end', async () => {
        try {
          // Save to S3 or your storage service (implement this)
          const s3Url = await uploadToStorage(csvFile);

          // Optionally save to database
          const leadListRepo = AppDataSource.getRepository(LeadList);
          const leadEntryRepo = AppDataSource.getRepository(LeadEntry);

          // Create the lead list entity
          const newLeadList = leadListRepo.create({
            name: mappingInfo.fileName || 'Imported Leads',
            orgId: req.orgId,
            totalLeads: results.length,
            description: `Imported on ${new Date().toLocaleDateString()}`,
            fileUrl: s3Url
          });

          // Save the lead list
          const savedLeadList = await leadListRepo.save(newLeadList);

          // Create lead entries for each processed row

          console.log(results)
          const leadEntries = results.filter(lead => lead.linkedinUrl).map(lead => {
            return leadEntryRepo.create({
              leadListId: savedLeadList.id,
              orgId: req.orgId,
              // Match exact field names from your database schema
              firstName: lead.firstName || '',
              lastName: lead.lastName || '',
              profile_url: lead.linkedinUrl || '', // This must not be null
              company: lead.company || '',
              title: lead.jobTitle || '',
              email: lead.email || '',
              location: lead.location || '',
              headLine: lead.headLine || '',
              customVariable: lead.customVariable || {},
              status: 'new'
            });
          });

          // Filter out any remaining entries with null profile_url
          const validEntries = leadEntries.filter(entry => entry.profile_url);

          // Save only valid entries
          if (validEntries.length > 0) {
            await leadEntryRepo.save(validEntries);
          }

          // Include the saved IDs in the response
          res.json({
            processedLeads: results,
            s3Url,
            success: true,
            totalRows: results.length,
            leadListId: savedLeadList.id  // Return the ID for frontend reference
          });
        } catch (error) {
          console.error('Error saving lead list:', error);
          res.status(500).json({ error: error.message });
        }
      });
  } catch (error) {
    console.error('Error processing leads:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getMessageVariables = async (req: Request, res: Response) => {
  try {
    // Get organization ID from auth middleware
    const orgId = req.orgId;
    
    // Define standard variables available in all campaigns
    const standardVariables = [
      { 
        id: 'first_name', 
        name: 'First Name', 
        description: 'Recipient\'s first name',
        placeholder: '{first_name}',
        exampleValue: 'John',
        type: 'system'
      },
      { 
        id: 'last_name', 
        name: 'Last Name', 
        description: 'Recipient\'s last name',
        placeholder: '{last_name}',
        exampleValue: 'Smith',
        type: 'system'
      },
      { 
        id: 'full_name', 
        name: 'Full Name', 
        description: 'Recipient\'s full name',
        placeholder: '{full_name}',
        exampleValue: 'John Smith',
        type: 'system'
      },
      { 
        id: 'company', 
        name: 'Company', 
        description: 'Recipient\'s company name',
        placeholder: '{company}',
        exampleValue: 'Acme Inc',
        type: 'system'
      },
      { 
        id: 'job_title', 
        name: 'Job Title', 
        description: 'Recipient\'s job title or position',
        placeholder: '{job_title}',
        exampleValue: 'Marketing Director',
        type: 'system'
      },
      { 
        id: 'headline', 
        name: 'Headline', 
        description: 'Recipient\'s LinkedIn headline',
        placeholder: '{headline}',
        exampleValue: 'Digital Marketing Expert | Growth Strategist',
        type: 'system'
      },
      { 
        id: 'location', 
        name: 'Location', 
        description: 'Recipient\'s location',
        placeholder: '{location}',
        exampleValue: 'San Francisco, CA',
        type: 'system'
      },
      { 
        id: 'connection_count', 
        name: 'Connections', 
        description: 'Number of connections',
        placeholder: '{connection_count}',
        exampleValue: '500+',
        type: 'system'
      },
      { 
        id: 'sender_name', 
        name: 'Sender Name', 
        description: 'Your name',
        placeholder: '{sender_name}',
        exampleValue: 'Alex Johnson',
        type: 'system'
      },
      { 
        id: 'sender_company', 
        name: 'Sender Company', 
        description: 'Your company name',
        placeholder: '{sender_company}',
        exampleValue: 'Growth Solutions',
        type: 'system'
      },
      { 
        id: 'sender_title', 
        name: 'Sender Title', 
        description: 'Your job title',
        placeholder: '{sender_title}',
        exampleValue: 'Sales Manager',
        type: 'system'
      }
    ];
    
    // Check if we should also get custom variables specific to this organization
    try {
      // This can be expanded in the future to include custom variables from database
      // const customVariablesRepo = AppDataSource.getRepository(CustomVariable);
      // const customVariables = await customVariablesRepo.find({ where: { orgId } });
      // const formattedCustomVars = customVariables.map(v => ({
      //   id: v.id,
      //   name: v.name,
      //   description: v.description,
      //   placeholder: `{${v.id}}`,
      //   exampleValue: v.exampleValue,
      //   type: 'custom'
      // }));
      // const allVariables = [...standardVariables, ...formattedCustomVars];
      
      return res.status(200).json({
        status: 200,
        variables: standardVariables,
        error: null
      });
    } catch (dbError) {
      // If there's an error getting custom variables, still return standard ones
      logger.error('Error fetching custom variables:', dbError);
      
      return res.status(200).json({
        status: 200,
        variables: standardVariables,
        error: null
      });
    }
  } catch (error: any) {
    logger.error('Error fetching message variables:', error);
    return res.status(500).json({
      status: 500,
      variables: [],
      error: error.message || 'Internal server error'
    });
  }
};