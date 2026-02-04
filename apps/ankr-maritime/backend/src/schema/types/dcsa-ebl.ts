/**
 * DCSA eBL 3.0 GraphQL Schema
 * Phase 33: Document Management System
 *
 * GraphQL types and resolvers for DCSA Electronic Bill of Lading 3.0 standard
 */

import { builder } from '../builder';
import { dcsaEBLService } from '../../services/dcsa-ebl-service';

// Input types
const DCSAPartyInput = builder.inputType('DCSAPartyInput', {
  fields: (t) => ({
    partyName: t.string({ required: true }),
    addressLine1: t.string({ required: true }),
    addressLine2: t.string(),
    city: t.string({ required: true }),
    stateRegion: t.string(),
    postalCode: t.string(),
    countryCode: t.string({ required: true }),
    taxReference: t.string(),
    eoriNumber: t.string(),
    publicKey: t.string(),
  }),
});

const DCSACargoItemInput = builder.inputType('DCSACargoItemInput', {
  fields: (t) => ({
    descriptionOfGoods: t.string({ required: true }),
    hsCode: t.string(),
    numberOfPackages: t.int({ required: true }),
    packageCode: t.string({ required: true }),
    weight: t.float({ required: true }),
    weightUnit: t.string({ required: true }),
    volume: t.float(),
    volumeUnit: t.string(),
    marksAndNumbers: t.string(),
  }),
});

const DCSALocationInput = builder.inputType('DCSALocationInput', {
  fields: (t) => ({
    locationName: t.string({ required: true }),
    UNLocationCode: t.string({ required: true }),
    facilityCode: t.string(),
    facilityCodeProvider: t.string(),
  }),
});

const DCSASignatureInput = builder.inputType('DCSASignatureInput', {
  fields: (t) => ({
    signerId: t.string({ required: true }),
    signerName: t.string({ required: true }),
    signatureType: t.string({ required: true }),
    signatureValue: t.string({ required: true }),
    algorithm: t.string({ required: true }),
    publicKey: t.string({ required: true }),
    certificateChain: t.stringList(),
  }),
});

const CreateeBLInput = builder.inputType('CreateeBLInput', {
  fields: (t) => ({
    documentId: t.string({ required: true }),
    blNumber: t.string({ required: true }),
    carrierBookingReference: t.string({ required: true }),
    shipper: t.field({ type: DCSAPartyInput, required: true }),
    consignee: t.field({ type: DCSAPartyInput, required: true }),
    notifyParties: t.field({ type: [DCSAPartyInput], required: true }),
    carrier: t.field({ type: DCSAPartyInput, required: true }),
    cargoDescription: t.string({ required: true }),
    cargoItems: t.field({ type: [DCSACargoItemInput], required: true }),
    totalGrossWeight: t.float({ required: true }),
    totalVolume: t.float({ required: true }),
    portOfLoading: t.field({ type: DCSALocationInput, required: true }),
    portOfDischarge: t.field({ type: DCSALocationInput, required: true }),
    placeOfReceipt: t.field({ type: DCSALocationInput }),
    placeOfDelivery: t.field({ type: DCSALocationInput }),
    vesselName: t.string({ required: true }),
    vesselIMO: t.string({ required: true }),
    voyageNumber: t.string({ required: true }),
    shippedOnBoardDate: t.string(),
    receivedForShipmentDate: t.string(),
    expectedDeliveryDate: t.string(),
    freightPaymentTerms: t.string({ required: true }),
    numberOfOriginalsIssued: t.int({ required: true }),
  }),
});

// Object types
const DCSAParty = builder.objectType('DCSAParty', {
  fields: (t) => ({
    partyName: t.string(),
    addressLine1: t.string(),
    addressLine2: t.string({ nullable: true }),
    city: t.string(),
    stateRegion: t.string({ nullable: true }),
    postalCode: t.string({ nullable: true }),
    countryCode: t.string(),
    taxReference: t.string({ nullable: true }),
    eoriNumber: t.string({ nullable: true }),
    publicKey: t.string({ nullable: true }),
  }),
});

const DCSACargoItem = builder.objectType('DCSACargoItem', {
  fields: (t) => ({
    descriptionOfGoods: t.string(),
    hsCode: t.string({ nullable: true }),
    numberOfPackages: t.int(),
    packageCode: t.string(),
    weight: t.float(),
    weightUnit: t.string(),
    volume: t.float({ nullable: true }),
    volumeUnit: t.string({ nullable: true }),
    marksAndNumbers: t.string({ nullable: true }),
  }),
});

const DCSALocation = builder.objectType('DCSALocation', {
  fields: (t) => ({
    locationName: t.string(),
    UNLocationCode: t.string(),
    facilityCode: t.string({ nullable: true }),
    facilityCodeProvider: t.string({ nullable: true }),
  }),
});

const DCSASignature = builder.objectType('DCSASignature', {
  fields: (t) => ({
    signerId: t.string(),
    signerName: t.string(),
    signatureType: t.string(),
    signatureValue: t.string(),
    signedAt: t.string(),
    algorithm: t.string(),
    publicKey: t.string(),
    certificateChain: t.stringList({ nullable: true }),
  }),
});

const DCSAEndorsement = builder.objectType('DCSAEndorsement', {
  fields: (t) => ({
    endorsementId: t.string(),
    fromParty: t.string(),
    toParty: t.string(),
    endorsedAt: t.string(),
    endorsementType: t.string(),
    signature: t.field({ type: DCSASignature }),
    previousTitleHolder: t.string(),
    newTitleHolder: t.string(),
    blockchainTxHash: t.string({ nullable: true }),
  }),
});

const DCSAeBL = builder.objectType('DCSAeBL', {
  fields: (t) => ({
    eblNumber: t.string(),
    blNumber: t.string(),
    status: t.string(),
    carrierBookingReference: t.string(),
    shipper: t.field({ type: DCSAParty }),
    consignee: t.field({ type: DCSAParty }),
    notifyParties: t.field({ type: [DCSAParty] }),
    carrier: t.field({ type: DCSAParty }),
    cargoDescription: t.string(),
    cargoItems: t.field({ type: [DCSACargoItem] }),
    totalGrossWeight: t.float(),
    totalVolume: t.float(),
    portOfLoading: t.field({ type: DCSALocation }),
    portOfDischarge: t.field({ type: DCSALocation }),
    placeOfReceipt: t.field({ type: DCSALocation, nullable: true }),
    placeOfDelivery: t.field({ type: DCSALocation, nullable: true }),
    vesselName: t.string(),
    vesselIMO: t.string(),
    voyageNumber: t.string(),
    shippedOnBoardDate: t.string({ nullable: true }),
    receivedForShipmentDate: t.string({ nullable: true }),
    expectedDeliveryDate: t.string({ nullable: true }),
    freightPaymentTerms: t.string(),
    numberOfOriginalsIssued: t.int(),
    isElectronic: t.boolean(),
    electronicSignatures: t.field({ type: [DCSASignature] }),
    endorsementChain: t.field({ type: [DCSAEndorsement] }),
    titleHolder: t.string(),
    issueDate: t.string(),
    issuedBy: t.string(),
    lastModifiedAt: t.string(),
    documentHash: t.string(),
    blockchainTxHash: t.string({ nullable: true }),
  }),
});

// Queries
builder.queryFields((t) => ({
  dcsaeBL: t.field({
    type: DCSAeBL,
    nullable: true,
    args: {
      documentId: t.arg.string({ required: true }),
    },
    resolve: async (_, { documentId }, ctx) => {
      if (!ctx.user) throw new Error('Not authenticated');

      const doc = await ctx.prisma.document.findUnique({
        where: { id: documentId, organizationId: ctx.user.organizationId },
      });

      if (!doc || !doc.metadata || !(doc.metadata as any).dcsa_ebl) {
        return null;
      }

      return (doc.metadata as any).dcsa_ebl;
    },
  }),

  dcsaEndorsementHistory: t.field({
    type: [DCSAEndorsement],
    args: {
      documentId: t.arg.string({ required: true }),
    },
    resolve: async (_, { documentId }, ctx) => {
      if (!ctx.user) throw new Error('Not authenticated');

      return dcsaEBLService.getEndorsementHistory(documentId);
    },
  }),

  verifyeBLIntegrity: t.boolean({
    args: {
      documentId: t.arg.string({ required: true }),
    },
    resolve: async (_, { documentId }, ctx) => {
      if (!ctx.user) throw new Error('Not authenticated');

      return dcsaEBLService.verifyeBLIntegrity(documentId);
    },
  }),
}));

// Mutations
builder.mutationFields((t) => ({
  createDCSAeBL: t.field({
    type: DCSAeBL,
    args: {
      input: t.arg({ type: CreateeBLInput, required: true }),
    },
    resolve: async (_, { input }, ctx) => {
      if (!ctx.user) throw new Error('Not authenticated');

      // Parse dates
      const bolData: any = {
        ...input,
        shippedOnBoardDate: input.shippedOnBoardDate ? new Date(input.shippedOnBoardDate) : undefined,
        receivedForShipmentDate: input.receivedForShipmentDate ? new Date(input.receivedForShipmentDate) : undefined,
        expectedDeliveryDate: input.expectedDeliveryDate ? new Date(input.expectedDeliveryDate) : undefined,
      };

      return dcsaEBLService.createeBL(
        input.documentId,
        bolData,
        ctx.user.id,
        ctx.user.organizationId
      );
    },
  }),

  issueDCSAeBL: t.field({
    type: DCSAeBL,
    args: {
      documentId: t.arg.string({ required: true }),
      carrierSignature: t.arg({ type: DCSASignatureInput, required: true }),
    },
    resolve: async (_, { documentId, carrierSignature }, ctx) => {
      if (!ctx.user) throw new Error('Not authenticated');

      const signature: any = {
        ...carrierSignature,
        signedAt: new Date(),
      };

      return dcsaEBLService.issueeBL(documentId, signature, ctx.user.id);
    },
  }),

  endorseDCSAeBL: t.field({
    type: DCSAeBL,
    args: {
      documentId: t.arg.string({ required: true }),
      fromPartyId: t.arg.string({ required: true }),
      toPartyId: t.arg.string({ required: true }),
      signature: t.arg({ type: DCSASignatureInput, required: true }),
      endorsementType: t.arg.string({ required: true }),
    },
    resolve: async (_, { documentId, fromPartyId, toPartyId, signature, endorsementType }, ctx) => {
      if (!ctx.user) throw new Error('Not authenticated');

      const sig: any = {
        ...signature,
        signedAt: new Date(),
      };

      return dcsaEBLService.endorseeBL(
        documentId,
        fromPartyId,
        toPartyId,
        sig,
        endorsementType as any,
        ctx.user.id
      );
    },
  }),

  surrenderDCSAeBL: t.field({
    type: DCSAeBL,
    args: {
      documentId: t.arg.string({ required: true }),
      currentHolderId: t.arg.string({ required: true }),
      signature: t.arg({ type: DCSASignatureInput, required: true }),
    },
    resolve: async (_, { documentId, currentHolderId, signature }, ctx) => {
      if (!ctx.user) throw new Error('Not authenticated');

      const sig: any = {
        ...signature,
        signedAt: new Date(),
      };

      return dcsaEBLService.surrendereBL(documentId, currentHolderId, sig, ctx.user.id);
    },
  }),

  accomplishDCSAeBL: t.field({
    type: DCSAeBL,
    args: {
      documentId: t.arg.string({ required: true }),
    },
    resolve: async (_, { documentId }, ctx) => {
      if (!ctx.user) throw new Error('Not authenticated');

      return dcsaEBLService.accomplisheBL(documentId, ctx.user.id);
    },
  }),

  exportDCSAeBLJSON: t.string({
    args: {
      documentId: t.arg.string({ required: true }),
    },
    resolve: async (_, { documentId }, ctx) => {
      if (!ctx.user) throw new Error('Not authenticated');

      const doc = await ctx.prisma.document.findUnique({
        where: { id: documentId, organizationId: ctx.user.organizationId },
      });

      if (!doc || !doc.metadata || !(doc.metadata as any).dcsa_ebl) {
        throw new Error('eBL not found');
      }

      const ebl = (doc.metadata as any).dcsa_ebl;

      return dcsaEBLService.exportToDCSAJSON(ebl);
    },
  }),
}));
