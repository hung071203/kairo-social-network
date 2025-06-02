import { BaseRepositoryInterface } from "src/base/base.interface.repository";
import { Report } from "src/schemas/reports.schema";

export interface ReportRepositoryInterface extends BaseRepositoryInterface<Report> {}