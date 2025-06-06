import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { LeadList } from './LeadListEntity';

@Entity('lead_entry')
export class LeadEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'profile_url', type: 'varchar' })
  profile_url!: string;

  @Column({ name: 'first_name', type: 'varchar', nullable: true })
  firstName?: string;

  @Column({ name: 'last_name', type: 'varchar', nullable: true })
  lastName?: string;

  @Column({ name: 'company', type: 'varchar', nullable: true })
  company?: string;

  @Column({ name: 'title', type: 'varchar', nullable: true })
  title?: string;

  @Column({ name: 'custom_fields', type: 'jsonb', nullable: true })
  customFields?: Record<string, any>;

  @Column({ name: 'lead_details', type: 'jsonb', nullable: true })
  leadDetails?: Record<string, { status: string; last_activity: string }>;

  @Column({ name: 'org_id', type: 'uuid' })
  orgId!: string;

  @ManyToOne(() => LeadList, (list) => list.leads, { onDelete: 'CASCADE' })
  leadList!: LeadList;
}

export interface LeadListEntry {
  id: string;
  firstName?: string;
  lastName?: string;
  linkedinUrl?: string;
  email?: string;
  company?: string;
  jobTitle?: string;
  location?: string;
  // Add any additional fields you need
  
  // New fields for tracking
  importedAt?: Date;
  lastModified?: Date;
  status?: 'new' | 'processing' | 'contacted' | 'responded' | 'converted';
}