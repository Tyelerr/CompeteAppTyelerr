@echo off
echo Replacing ModalPickWinner.tsx with enhanced version...
cd CompeteApp\screens\Shop
del ModalPickWinner.tsx
ren ModalPickWinner_Enhanced.tsx ModalPickWinner.tsx
echo Done! ModalPickWinner.tsx has been updated.
pause
