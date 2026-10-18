import mongoose from 'mongoose';
import {
  DeliveryTask,
  Dispatch,
  Order,
  Customer,
  PaymentCollection,
} from '../database/models/index.js';
import {
  CompleteDeliveryInput,
  FailDeliveryInput,
  DeliveryStatus,
  CollectionStatus,
  PaymentMethod,
} from '@metriflow/contracts';
import { AppError } from '../utils/errors.js';
import { withTransaction } from '../database/connection.js';

export class FieldService {
  async listAssignedDeliveries(tenantId: mongoose.Types.ObjectId, driverId: string) {
    return DeliveryTask.find({
      tenantId,
      assignedDriverId: new mongoose.Types.ObjectId(driverId),
      status: { $in: [DeliveryStatus.ASSIGNED, DeliveryStatus.OUT_FOR_DELIVERY] },
    })
      .populate('customerId', 'name phone address city')
      .populate('dispatchId')
      .sort({ createdAt: 1 });
  }

  async completeDelivery(
    tenantId: mongoose.Types.ObjectId,
    taskId: string,
    input: CompleteDeliveryInput,
    driverId: string
  ) {
    return withTransaction(async (session) => {
      const task = await DeliveryTask.findOne({
        _id: taskId,
        tenantId,
        assignedDriverId: new mongoose.Types.ObjectId(driverId),
      }).session(session);

      if (!task) throw AppError.notFound('Delivery task not found or not assigned to you.');
      if (task.status === DeliveryStatus.DELIVERED) {
        throw AppError.badRequest('Delivery task is already completed.');
      }

      const collectedPaisa = parseInt(input.collectedAmountPaisa || '0', 10);
      let collectionDoc: any = null;

      if (collectedPaisa > 0) {
        const receiptNumber = `RCP-DEL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
        collectionDoc = await PaymentCollection.create(
          [
            {
              tenantId,
              receiptNumber,
              customerId: task.customerId,
              amountPaisa: collectedPaisa,
              allocatedAmountPaisa: 0,
              unallocatedAmountPaisa: collectedPaisa,
              paymentMethod: PaymentMethod.CASH,
              evidenceStoragePath: input.photoEvidenceId || input.signatureImageId,
              status: CollectionStatus.PENDING_VERIFICATION,
              collectedBy: new mongoose.Types.ObjectId(driverId),
              notes: `Collected on delivery for task ${task.taskNumber}`,
            },
          ],
          { session }
        );
      }

      task.status = DeliveryStatus.DELIVERED;
      task.recipientName = input.recipientName;
      task.recipientPhone = input.recipientPhone;
      task.signatureImageId = input.signatureImageId;
      task.photoEvidenceId = input.photoEvidenceId;
      task.collectedAmountPaisa = collectedPaisa;
      task.collectionReceiptId = collectionDoc ? collectionDoc[0]._id : undefined;
      task.completedAt = new Date();
      await task.save({ session });

      return {
        message: 'Delivery completed with proof of delivery captured.',
        task,
        collectionSubmitted: !!collectionDoc,
      };
    });
  }

  async failDelivery(
    tenantId: mongoose.Types.ObjectId,
    taskId: string,
    input: FailDeliveryInput,
    driverId: string
  ) {
    const task = await DeliveryTask.findOne({
      _id: taskId,
      tenantId,
      assignedDriverId: new mongoose.Types.ObjectId(driverId),
    });

    if (!task) throw AppError.notFound('Delivery task not found or not assigned to you.');

    task.status = DeliveryStatus.FAILED;
    task.failureReasonCode = input.reasonCode;
    task.failureNotes = input.notes;
    await task.save();

    return {
      message: 'Delivery marked as failed. Dispatches remain in place for warehouse return review.',
      task,
    };
  }
}

export const fieldService = new FieldService();
