import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { LeadEntry } from './LeadListEntry';

@Entity('lead_list')
export class LeadList {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'name', type: 'varchar' })
  name!: string;

  @Column({ name: 'total_leads', type: 'int' })
  totalLeads!: number;

  @Column({ name: 'campaign_ids', type: 'text', array: true, default: () => "'{}'" })
  campaignIds!: string[];

  @Column({ name: 'org_id', type: 'uuid' })
  orgId!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'mapped_headers', type: 'jsonb', nullable: true })
  mappedHeaders?: any;

  @OneToMany(() => LeadEntry, (entry) => entry.leadList, { cascade: true })
  leads!: LeadEntry[];

  // New properties for CSV mapping
  columnMappings?: ColumnMapping[];
  originalFileName?: string;
  fileS3Url?: string;
  importedAt?: Date;
}

export interface ColumnMapping {
  columnName: string;
  mappedType: string;
  sampleValues?: string[];
}