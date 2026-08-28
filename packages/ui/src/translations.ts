/** Explicit translations for Angular compile-time constructs with no Vanilla runtime object. */
export const ANGULAR_UI_TRANSLATIONS = Object.freeze({
  AfricaniesActionsModule: 'defineAfricaniesElements()',
  AfricaniesFeedbackModule: 'defineAfricaniesElements()',
  AfricaniesFormsModule: 'defineAfricaniesElements()',
  AfricaniesInfoPopoverModule: 'defineAfricaniesElements()',
  AfricaniesNavigationModule: 'defineAfricaniesElements()',
  AfricaniesStepperModule: 'defineAfricaniesElements()',
  AfricaniesTableModule: 'defineAfricaniesElements()',
  AfricaniesTooltipModule: 'defineAfricaniesElements()',
  ActionMenuTriggerDirective: '<africanies-action-menu-trigger>',
  TooltipTriggerDirective: '<africanies-tooltip> trigger slot',
  InfoPopoverTriggerDirective: '<africanies-info-popover> trigger slot',
  InfoPopoverContentDirective: '<africanies-info-popover> default slot',
  TabDefDirective: 'named slots on <africanies-tabs>',
  CellDefDirective: 'TableColumn.render callback',
  HeaderCellDefDirective: 'TableColumn.label',
  RowDetailDefDirective: 'TableComponent.rowDetail callback',
  StepDefDirective: 'named slots on <africanies-stepper>',
  OverlayHeaderDirective: 'header slot on <africanies-overlay-frame>',
  OverlayFooterDirective: 'footer slot on <africanies-overlay-frame>',
  OVERLAY_DATA: 'OverlayContext.data',
  GOOGLE_PLACES_CONFIG: 'provideGooglePlaces(config, fetch)',
  provideAfricaniesUiOverlays: 'new ModalService({ document }) / new DrawerService({ document })',
  provideAfricaniesToasts: 'new ToastService({ document })'
} as const);

export type AngularUiTranslationName = keyof typeof ANGULAR_UI_TRANSLATIONS;
export function angularUiTranslation(name: AngularUiTranslationName): string { return ANGULAR_UI_TRANSLATIONS[name]; }
