import mongoose from 'mongoose';
import {
  Customer,
  Supplier,
  Invoice,
  JournalEntry,
  Expense,
} from '../database/models/index.js';
import { AppError } from '../utils/errors.js';

export class ReportingService {
  /**
   * Customer Khata Statement with running balance
   */
  async getCustomerKhata(tenantId: mongoose.Types.ObjectId, customerId: string) {
    const customer = await Customer.findOne({ _id: customerId, tenantId });
    if (!customer) throw AppError.notFound('Customer not found.');

    const journalEntries = await JournalEntry.find({
      tenantId,
      'lines.entityType': 'CUSTOMER',
      'lines.entityId': customer._id,
    }).sort({ entryDate: 1 });

    let runningBalancePaisa = 0;
    const transactions = journalEntries.map((je) => {
      const line = je.lines.find(
        (l) => l.entityType === 'CUSTOMER' && l.entityId?.toString() === customer._id.toString()
      );
      const debit = line?.debitPaisa || 0;
      const credit = line?.creditPaisa || 0;
      runningBalancePaisa += debit - credit;

      return {
        date: je.entryDate,
        entryNumber: je.entryNumber,
        referenceType: je.referenceType,
        referenceId: je.referenceId,
        description: line?.description || je.notes,
        debitPaisa: debit,
        creditPaisa: credit,
        runningBalancePaisa,
      };
    });

    return {
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        creditLimitPaisa: customer.creditLimitPaisa,
        creditDays: customer.creditDays,
        currentBalancePaisa: customer.currentBalancePaisa,
      },
      transactions,
    };
  }

  /**
   * Accounts Receivable Aging Report:
   * Buckets: Not Due, 1-30, 31-60, 61-90, Over 90 Days
   */
  async getArAgingReport(tenantId: mongoose.Types.ObjectId) {
    const unpaidInvoices = await Invoice.find({
      tenantId,
      balanceDuePaisa: { $gt: 0 },
    }).populate('customerId', 'name phone creditDays');

    const now = Date.now();
    let totalArPaisa = 0;
    let notDuePaisa = 0;
    let days1To30Paisa = 0;
    let days31To60Paisa = 0;
    let days61To90Paisa = 0;
    let over90Paisa = 0;

    const customerAgingMap: Record<string, any> = {};

    for (const inv of unpaidInvoices) {
      const customer = inv.customerId as any;
      if (!customer) continue;

      const custId = customer._id.toString();
      if (!customerAgingMap[custId]) {
        customerAgingMap[custId] = {
          customerId: custId,
          customerName: customer.name,
          phone: customer.phone,
          totalPaisa: 0,
          notDuePaisa: 0,
          days1To30Paisa: 0,
          days31To60Paisa: 0,
          days61To90Paisa: 0,
          over90Paisa: 0,
        };
      }

      const diffDays = Math.floor((now - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      const due = inv.balanceDuePaisa;
      totalArPaisa += due;
      customerAgingMap[custId].totalPaisa += due;

      if (diffDays <= 0) {
        notDuePaisa += due;
        customerAgingMap[custId].notDuePaisa += due;
      } else if (diffDays <= 30) {
        days1To30Paisa += due;
        customerAgingMap[custId].days1To30Paisa += due;
      } else if (diffDays <= 60) {
        days31To60Paisa += due;
        customerAgingMap[custId].days31To60Paisa += due;
      } else if (diffDays <= 90) {
        days61To90Paisa += due;
        customerAgingMap[custId].days61To90Paisa += due;
      } else {
        over90Paisa += due;
        customerAgingMap[custId].over90Paisa += due;
      }
    }

    return {
      summary: {
        totalArPaisa,
        notDuePaisa,
        days1To30Paisa,
        days31To60Paisa,
        days61To90Paisa,
        over90Paisa,
      },
      customers: Object.values(customerAgingMap),
    };
  }

  /**
   * Deterministic Profit & Loss Statement:
   * Net Sales = Revenue - Returns
   * COGS = Actual issue cost at dispatch - restored return cost
   * Gross Profit = Net Sales - COGS
   * Net Profit = Gross Profit - Operating Expenses
   */
  async getProfitAndLoss(tenantId: mongoose.Types.ObjectId, startDate?: Date, endDate?: Date) {
    const matchFilter: any = { tenantId };
    if (startDate || endDate) {
      matchFilter.entryDate = {};
      if (startDate) matchFilter.entryDate.$gte = startDate;
      if (endDate) matchFilter.entryDate.$lte = endDate;
    }

    const entries = await JournalEntry.find(matchFilter);

    let salesRevenuePaisa = 0;
    let salesReturnsPaisa = 0;
    let cogsPaisa = 0;
    let cogsReversalsPaisa = 0;

    for (const entry of entries) {
      for (const line of entry.lines) {
        if (line.account === 'SALES_REVENUE') {
          salesRevenuePaisa += line.creditPaisa;
          salesReturnsPaisa += line.debitPaisa;
        } else if (line.account === 'COST_OF_GOODS_SOLD') {
          cogsPaisa += line.debitPaisa;
          cogsReversalsPaisa += line.creditPaisa;
        }
      }
    }

    const netSalesPaisa = salesRevenuePaisa - salesReturnsPaisa;
    const netCogsPaisa = cogsPaisa - cogsReversalsPaisa;
    const grossProfitPaisa = netSalesPaisa - netCogsPaisa;

    // Operating Expenses
    const expenseFilter: any = { tenantId };
    if (startDate || endDate) {
      expenseFilter.expenseDate = {};
      if (startDate) expenseFilter.expenseDate.$gte = startDate;
      if (endDate) expenseFilter.expenseDate.$lte = endDate;
    }

    const expenses = await Expense.find(expenseFilter);
    let totalOperatingExpensesPaisa = 0;
    const expenseCategoryMap: Record<string, number> = {};

    for (const exp of expenses) {
      totalOperatingExpensesPaisa += exp.amountPaisa;
      expenseCategoryMap[exp.category] = (expenseCategoryMap[exp.category] || 0) + exp.amountPaisa;
    }

    const netProfitPaisa = grossProfitPaisa - totalOperatingExpensesPaisa;

    return {
      revenue: {
        grossSalesPaisa: salesRevenuePaisa,
        returnsPaisa: salesReturnsPaisa,
        netSalesPaisa,
      },
      costOfGoodsSold: {
        grossCogsPaisa: cogsPaisa,
        restoredCostPaisa: cogsReversalsPaisa,
        netCogsPaisa,
      },
      grossProfitPaisa,
      operatingExpenses: {
        totalPaisa: totalOperatingExpensesPaisa,
        byCategory: expenseCategoryMap,
      },
      netProfitPaisa,
    };
  }
}

export const reportingService = new ReportingService();
