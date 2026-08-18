import { create } from "zustand"
import type { ModalData, ModalName } from "../types"

interface ModalState {
  modal: ModalName
  modalData: ModalData | null

  openModal: (name: ModalName, data?: ModalData | null) => void
  closeModal: () => void
}

export const useModalStore = create<ModalState>((set) => ({
  modal: null,
  modalData: null,

  openModal: (name, data = null) => set({ modal: name, modalData: data }),
  closeModal: () => set({ modal: null, modalData: null }),
}))
