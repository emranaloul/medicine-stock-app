'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import AssistantLauncher from '@/components/medicine/AssistantLauncher';
import ConfirmActionDialog from '@/components/medicine/ConfirmActionDialog';
import DashboardHeader from '@/components/medicine/DashboardHeader';
import DashboardNotice from '@/components/medicine/DashboardNotice';
import DuplicatesDialog from '@/components/medicine/DuplicatesDialog';
import FamilyDialog from '@/components/medicine/FamilyDialog';
import InventorySummary from '@/components/medicine/InventorySummary';
import MedicineFilters from '@/components/medicine/MedicineFilters';
import MedicineFormDialog from '@/components/medicine/MedicineFormDialog';
import MedicineTable from '@/components/medicine/MedicineTable';
import ScanProgressDialog from '@/components/medicine/ScanProgressDialog';
import ScanReviewDialog from '@/components/medicine/ScanReviewDialog';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import type { Medicine, MedicineFamily } from '@/types/medicine';
import { useMedicineDashboard } from '@/hooks/useMedicineDashboard';

const PharmacyAssistant = dynamic(() => import('./PharmacyAssistant'), {
  loading: () => null,
});

export default function MedicineDashboard({
  locale,
  dictionary,
  initialMedicines,
  user,
  families,
}: {
  locale: Locale;
  dictionary: Dictionary;
  initialMedicines: Medicine[];
  user: { id: string; name: string; email: string };
  families: MedicineFamily[];
}) {
  const { inventory, filters, dialogs, pending, actions } =
    useMedicineDashboard({ locale, dictionary, initialMedicines, families });
  const [showChat, setShowChat] = useState(false);
  const [chatMounted, setChatMounted] = useState(false);

  useEffect(() => {
    document.body.classList.add('medicine-dashboard');
    return () => document.body.classList.remove('medicine-dashboard');
  }, []);

  return (
    <div className='medicine-dashboard medicine-shell pb-16'>
      <a href='#dashboard-main' className='dashboard-skip-link'>
        {dictionary.common.skipToContent}
      </a>
      <DashboardHeader
        locale={locale}
        dictionary={dictionary}
        userName={user.name}
        families={families}
        scope={inventory.scope}
        activeFamilyId={inventory.activeFamilyId}
        scopeLoading={inventory.scopeLoading}
        pendingScope={inventory.pendingScope}
        scanning={pending.scanning}
        loading={pending.loading}
        pendingAction={pending.pendingAction}
        duplicateCount={inventory.duplicateGroups.length}
        logoutLoading={pending.logoutLoading}
        onManageFamily={() => dialogs.setShowFamilyModal(true)}
        onLogout={() => void actions.logout()}
        onScopeChange={(scope, familyId) =>
          void actions.switchScope(scope, familyId)
        }
        onAddManual={actions.openAddModal}
        onImageUpload={(file) => void actions.handleImageUpload(file)}
        onReset={() => dialogs.setShowResetConfirm(true)}
        onShowDuplicates={() => dialogs.setShowDuplicatesModal(true)}
      />

      <main
        id='dashboard-main'
        tabIndex={-1}
        className='mx-auto mt-8 max-w-screen-2xl space-y-8 px-4 pb-16 sm:px-6 lg:px-8'
      >
        <InventorySummary
          locale={locale}
          dictionary={dictionary}
          stats={inventory.stats}
          selectedStatus={filters.selectedStatus}
          onSelectStatus={filters.selectStatus}
        />
        <div className='dash-ledger'>
          <MedicineFilters
            locale={locale}
            dictionary={dictionary}
            totalItems={inventory.medicines.length}
            resultCount={inventory.filteredMedicines.length}
            search={filters.search}
            selectedCategory={filters.selectedCategory}
            selectedStatus={filters.selectedStatus}
            onSearchChange={(value) => {
              filters.setSearch(value);
              filters.setCurrentPage(1);
            }}
            onCategoryChange={(value) => {
              filters.setSelectedCategory(value);
              filters.setCurrentPage(1);
            }}
            onStatusChange={filters.selectStatus}
          />
          <MedicineTable
            locale={locale}
            dictionary={dictionary}
            items={inventory.paginatedMedicines}
            totalItems={inventory.filteredMedicines.length}
            pendingMedicineIds={inventory.pendingMedicineIds}
            firstVisibleItem={inventory.firstVisibleItem}
            lastVisibleItem={inventory.lastVisibleItem}
            pageSize={filters.pageSize}
            pageNumbers={inventory.pageNumbers}
            visiblePage={inventory.visiblePage}
            pageCount={inventory.pageCount}
            onPageSizeChange={(size) => {
              filters.setPageSize(size);
              filters.setCurrentPage(1);
            }}
            onPageChange={(page) =>
              filters.setCurrentPage(
                Math.max(1, Math.min(page, inventory.pageCount)),
              )
            }
            onQuantityChange={(item, delta) =>
              void actions.handleQuantityChange(item, delta)
            }
            onEdit={actions.openEditModal}
            onDelete={actions.requestDelete}
          />
        </div>
      </main>

      <ScanProgressDialog open={pending.scanning} dictionary={dictionary} />
      <DashboardNotice
        dictionary={dictionary}
        notice={dialogs.notice}
        onClose={dialogs.clearNotice}
      />
      <ScanReviewDialog
        locale={locale}
        dictionary={dictionary}
        items={pending.extractedItems}
        saving={pending.pendingAction === 'batch'}
        onChange={actions.updateExtractedItem}
        onClose={actions.closeScanReview}
        onSave={() => void actions.saveExtractedItems()}
      />

      {chatMounted && (
        <PharmacyAssistant
          open={showChat}
          scope={inventory.scope}
          familyId={inventory.activeFamilyId}
          locale={locale}
          dictionary={dictionary}
          onClose={() => setShowChat(false)}
        />
      )}
      {!showChat && (
        <AssistantLauncher
          dictionary={dictionary}
          onClick={() => {
            setChatMounted(true);
            setShowChat(true);
          }}
        />
      )}

      <MedicineFormDialog
        dictionary={dictionary}
        open={dialogs.isFormOpen}
        editing={dialogs.editingId !== null}
        initialValues={dialogs.formData}
        saving={pending.pendingAction === 'save'}
        onOpenChange={dialogs.setIsFormOpen}
        onSave={(values) => void actions.handleSaveForm(values)}
      />
      <FamilyDialog
        dictionary={dictionary}
        open={dialogs.showFamilyModal}
        families={families}
        scope={inventory.scope}
        activeFamilyId={inventory.activeFamilyId}
        copyingFamilyId={pending.copyingFamilyId}
        copiedFamilyId={pending.copiedFamilyId}
        onOpenChange={dialogs.setShowFamilyModal}
        onCopy={(family) => void actions.copyInviteCode(family)}
      />
      <DuplicatesDialog
        locale={locale}
        dictionary={dictionary}
        open={dialogs.showDuplicatesModal}
        groups={inventory.duplicateGroups}
        onOpenChange={dialogs.setShowDuplicatesModal}
      />
      <ConfirmActionDialog
        dictionary={dictionary}
        open={dialogs.deleteTarget !== null}
        title={
          dialogs.deleteTarget
            ? dictionary.dashboard.deleteMedicine.replace(
                '{name}',
                dialogs.deleteTarget.name,
              )
            : dictionary.dashboard.deleteAction
        }
        description={dialogs.deleteDescription}
        actionLabel={dictionary.dashboard.deleteAction}
        destructive
        onOpenChange={(open) => {
          if (!open) dialogs.closeDeleteDialog();
        }}
        onConfirm={() => void actions.confirmDelete()}
      />
      <ConfirmActionDialog
        dictionary={dictionary}
        open={dialogs.showResetConfirm}
        title={dictionary.dashboard.restoreStockTitle}
        description={dictionary.dashboard.resetConfirm}
        actionLabel={dictionary.dashboard.restoreStock}
        onOpenChange={dialogs.setShowResetConfirm}
        onConfirm={() => void actions.resetSeed()}
      />
    </div>
  );
}
