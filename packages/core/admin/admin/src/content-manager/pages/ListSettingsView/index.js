import React, { memo, useContext, useMemo, useReducer, useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useMutation } from 'react-query';
import isEqual from 'lodash/isEqual';
import upperFirst from 'lodash/upperFirst';
import pick from 'lodash/pick';
import get from 'lodash/get';
import { stringify } from 'qs';
import { useNotification, useTracking, ConfirmDialog } from '@strapi/helper-plugin';
import { useIntl } from 'react-intl';
import { Box } from '@strapi/parts/Box';
import { Row } from '@strapi/parts/Row';
import { Stack } from '@strapi/parts/Stack';
import { Divider } from '@strapi/parts/Divider';
import { Layout, HeaderLayout, ContentLayout } from '@strapi/parts/Layout';
import { Link } from '@strapi/parts/Link';
import { Main } from '@strapi/parts/Main';
import { H3 } from '@strapi/parts/Text';
import { Select, Option } from '@strapi/parts/Select';
import { Button } from '@strapi/parts/Button';
import CheckIcon from '@strapi/icons/CheckIcon';
import BackIcon from '@strapi/icons/BackIcon';
// import LayoutDndProvider from '../../components/LayoutDndProvider';
import { checkIfAttributeIsDisplayable, getTrad } from '../../utils';
import ModelsContext from '../../contexts/ModelsContext';
import { usePluginsQueryParams } from '../../hooks';
import putCMSettingsLV from './utils/api';
import Settings from './components/Settings';
import DraggableCard from './components/DraggableCard';
import init from './init';
import reducer, { initialState } from './reducer';
import { EXCLUDED_SORT_OPTIONS } from './utils/excludedSortOptions';

const Flex = styled(Box)`
  flex: ${({ size }) => size};
`;

const ScrollableContainer = styled(Flex)`
  overflow-x: scroll;
  overflow-y: hidden;
`;

const SelectContainer = styled(Flex)`
  max-width: ${200 / 16}rem;
`;

const ListSettingsView = ({ layout, slug }) => {
  const { formatMessage } = useIntl();
  const { trackUsage } = useTracking();
  const pluginsQueryParams = usePluginsQueryParams();
  const toggleNotification = useNotification();
  const { refetchData } = useContext(ModelsContext);
  const [showWarningSubmit, setWarningSubmit] = useState(false);
  const toggleWarningSubmit = () => setWarningSubmit(prevState => !prevState);
  const [reducerState, dispatch] = useReducer(reducer, initialState, () =>
    init(initialState, layout)
  );
  // const [isOpen, setIsOpen] = useState(false);
  // const [isModalFormOpen, setIsModalFormOpen] = useState(false);
  // const [isDraggingSibling, setIsDraggingSibling] = useState(false);
  // const toggleModalForm = () => setIsModalFormOpen(prevState => !prevState);

  const {
    // labelForm,
    // labelToEdit,
    initialData,
    modifiedData,
  } = reducerState;

  // const attributes = useMemo(() => {
  //   return get(modifiedData, ['attributes'], {});
  // }, [modifiedData]);

  const { attributes } = layout;

  const displayedFields = useMemo(() => {
    return get(modifiedData, ['layouts', 'list'], []);
  }, [modifiedData]);

  const sortOptions = Object.entries(attributes).reduce((acc, cur) => {
    const [name, { type }] = cur;

    if (!EXCLUDED_SORT_OPTIONS.includes(type)) {
      acc.push(name);
    }

    return acc;
  }, []);

  // const handleClickEditLabel = labelToEdit => {
  //   dispatch({
  //     type: 'SET_LABEL_TO_EDIT',
  //     labelToEdit,
  //   });
  //   toggleModalForm();
  // };

  // const handleClosed = () => {
  //   dispatch({
  //     type: 'UNSET_LABEL_TO_EDIT',
  //   });
  // };

  const handleChange = ({ target: { name, value } }) => {
    dispatch({
      type: 'ON_CHANGE',
      keys: name,
      value: name === 'settings.pageSize' ? parseInt(value, 10) : value,
    });
  };

  const goBackUrl = () => {
    const {
      settings: { pageSize, defaultSortBy, defaultSortOrder },
      kind,
      uid,
    } = initialData;
    const sort = `${defaultSortBy}:${defaultSortOrder}`;
    const goBackSearch = `${stringify(
      {
        page: 1,
        pageSize,
        sort,
      },
      { encode: false }
    )}${pluginsQueryParams ? `&${pluginsQueryParams}` : ''}`;

    return `/content-manager/${kind}/${uid}?${goBackSearch}`;
  };

  const handleConfirm = async () => {
    const body = pick(modifiedData, ['layouts', 'settings', 'metadatas']);
    submitMutation.mutateAsync(body);
  };

  const handleAddField = item => {
    dispatch({
      type: 'ADD_FIELD',
      item,
    });
  };

  const handleRemoveField = (e, index) => {
    e.stopPropagation();

    if (displayedFields.length === 1) {
      toggleNotification({
        type: 'info',
        message: { id: getTrad('notification.info.minimumFields') },
      });
    } else {
      dispatch({
        type: 'REMOVE_FIELD',
        index,
      });
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    toggleWarningSubmit();
    trackUsage('willSaveContentTypeLayout');
  };

  const submitMutation = useMutation(body => putCMSettingsLV(body, slug), {
    onSuccess: async () => {
      trackUsage('didEditListSettings');
      refetchData();
    },
    onError: () => {
      toggleNotification({
        type: 'warning',
        message: { id: 'notification.error' },
      });
    },
  });
  const { isLoading: isSubmittingForm } = submitMutation;

  const metadatas = get(modifiedData, ['metadatas'], {});
  const listRemainingFields = useMemo(() => {
    return Object.keys(metadatas)
      .filter(key => {
        return checkIfAttributeIsDisplayable(get(attributes, key, {}));
      })
      .filter(field => {
        return !displayedFields.includes(field);
      })
      .sort();
  }, [displayedFields, attributes, metadatas]);

  // const handleClickEditLabel = labelToEdit => {
  //   dispatch({
  //     type: 'SET_LABEL_TO_EDIT',
  //     labelToEdit,
  //   });
  //   toggleModalForm();
  // };

  // const handleClosed = () => {
  //   dispatch({
  //     type: 'UNSET_LABEL_TO_EDIT',
  //   });
  // };

  // const handleChangeEditLabel = ({ target: { name, value } }) => {
  //   dispatch({
  //     type: 'ON_CHANGE_LABEL_METAS',
  //     name,
  //     value,
  //   });
  // };

  // const move = (originalIndex, atIndex) => {
  //   dispatch({
  //     type: 'MOVE_FIELD',
  //     originalIndex,
  //     atIndex,
  //   });
  // };

  // const [, drop] = useDrop({ accept: ItemTypes.FIELD });

  // const renderForm = () => {
  //   const type = get(attributes, [labelToEdit, 'type'], 'text');
  //   const relationType = get(attributes, [labelToEdit, 'relationType']);
  //   let shouldDisplaySortToggle = !['media', 'relation'].includes(type);
  //   const label = formatMessage({ id: getTrad('form.Input.label') });
  //   const description = formatMessage({ id: getTrad('form.Input.label.inputDescription') });

  //   if (['oneWay', 'oneToOne', 'manyToOne'].includes(relationType)) {
  //     shouldDisplaySortToggle = true;
  //   }

  //   return (
  //     <>
  //       <div className="col-6" style={{ marginBottom: 4 }}>
  //         <Input
  //           description={description}
  //           label={label}
  //           type="text"
  //           name="label"
  //           onBlur={() => {}}
  //           value={get(labelForm, 'label', '')}
  //           onChange={handleChangeEditLabel}
  //         />
  //       </div>
  //       {shouldDisplaySortToggle && (
  //         <div className="col-6" style={{ marginBottom: 4 }}>
  //           <Input
  //             label={formatMessage({ id: getTrad('form.Input.sort.field') })}
  //             type="bool"
  //             name="sortable"
  //             value={get(labelForm, 'sortable', false)}
  //             onChange={handleChangeEditLabel}
  //           />
  //         </div>
  //       )}
  //     </>
  //   );
  // };

  return (
    <Layout>
      <Main aria-busy={isSubmittingForm}>
        <form onSubmit={handleSubmit}>
          <HeaderLayout
            navigationAction={
              <Link startIcon={<BackIcon />} to={goBackUrl} id="go-back">
                {formatMessage({ id: 'app.components.go-back', defaultMessage: 'Go back' })}
              </Link>
            }
            primaryAction={
              <Button
                size="L"
                startIcon={<CheckIcon />}
                disabled={isEqual(modifiedData, initialData)}
                type="submit"
              >
                {formatMessage({ id: 'form.button.save', defaultMessage: 'Save' })}
              </Button>
            }
            subtitle={formatMessage({
              id: `components.SettingsViewWrapper.pluginHeader.description.list-settings`,
              defaultMessage: `Define the settings of the list view.`,
            })}
            title={formatMessage(
              {
                id: 'components.SettingsViewWrapper.pluginHeader.title',
                defaultMessage: 'Configure the view - {name}',
              },
              { name: upperFirst(modifiedData.info.label) }
            )}
          />
          <ContentLayout>
            <Box
              background="neutral0"
              hasRadius
              shadow="tableShadow"
              paddingTop={6}
              paddingBottom={6}
              paddingLeft={7}
              paddingRight={7}
            >
              <Settings
                modifiedData={modifiedData}
                onChange={handleChange}
                sortOptions={sortOptions}
              />
              <Box paddingTop={6} paddingBottom={6}>
                <Divider />
              </Box>
              <Box paddingBottom={4}>
                <H3 as="h2">
                  {formatMessage({
                    id: 'content-manager.containers.SettingPage.view',
                    defaultMessage: 'View',
                  })}
                </H3>
              </Box>
              <Row
                paddingTop={4}
                paddingLeft={4}
                paddingRight={4}
                borderColor="neutral300"
                borderStyle="dashed"
                borderWidth="1px"
                hasRadius
              >
                <ScrollableContainer size="1" paddingBottom={4}>
                  <Stack horizontal size={3}>
                    {displayedFields.map((field, index) => (
                      <DraggableCard
                        onRemoveField={e => handleRemoveField(e, index)}
                        key={field}
                        title={field}
                      />
                    ))}
                  </Stack>
                </ScrollableContainer>
                <SelectContainer size="auto" paddingBottom={4}>
                  <Select
                    disabled={listRemainingFields.length <= 0}
                    onChange={e => handleAddField(e)}
                    value=""
                    placeholder="Add a field"
                    data-testid="select-fields"
                  >
                    {listRemainingFields.map(field => (
                      <Option id={field} value={field} key={field}>
                        {field}
                      </Option>
                    ))}
                  </Select>
                </SelectContainer>
              </Row>
            </Box>
          </ContentLayout>
          <ConfirmDialog
            bodyText={{
              id: 'content-manager.popUpWarning.warning.updateAllSettings',
              defaultMessage: 'This will modify all your settings',
            }}
            iconRightButton={<CheckIcon />}
            isConfirmButtonLoading={isSubmittingForm}
            isOpen={showWarningSubmit}
            onToggleDialog={toggleWarningSubmit}
            onConfirm={handleConfirm}
            variantRightButton="success-light"
          />
        </form>
      </Main>
    </Layout>

    //     <LayoutDndProvider
    //       isDraggingSibling={isDraggingSibling}
    //       setIsDraggingSibling={setIsDraggingSibling}
    //     >
    //       <SettingsViewWrapper
    //         displayedFields={displayedFields}
    //         inputs={forms}
    //         isLoading={false}
    //         initialData={initialData}
    //         modifiedData={modifiedData}
    //         onChange={handleChange}
    //         onConfirmReset={() => {
    //           dispatch({
    //             type: 'ON_RESET',
    //           });
    //         }}
    //         onConfirmSubmit={handleConfirm}
    //         onModalConfirmClosed={refetchData}
    //         name={getName}
    //       >
    //         <DragWrapper>
    //           <div className="row">
    //             <div className="col-12">
    //               <SortWrapper
    //                 ref={drop}
    //                 style={{
    //                   display: 'flex',
    //                   width: '100%',
    //                 }}
    //               >
    //                 {displayedFields.map((item, index) => {
    //                   const label = get(modifiedData, ['metadatas', item, 'list', 'label'], '');

    //                   return (
    //                     <Label
    //                       count={displayedFields.length}
    //                       key={item}
    //                       index={index}
    //                       isDraggingSibling={isDraggingSibling}
    //                       label={label}
    //                       move={move}
    //                       name={item}
    //                       onClick={handleClickEditLabel}
    //                       onRemove={e => {
    //                         e.stopPropagation();

    //                         if (displayedFields.length === 1) {
    //                           toggleNotification({
    //                             type: 'info',
    //                             message: { id: getTrad('notification.info.minimumFields') },
    //                           });
    //                         } else {
    //                           dispatch({
    //                             type: 'REMOVE_FIELD',
    //                             index,
    //                           });
    //                         }
    //                       }}
    //                       selectedItem={labelToEdit}
    //                       setIsDraggingSibling={setIsDraggingSibling}
    //                     />
    //                   );
    //                 })}
    //               </SortWrapper>
    //             </div>
    //           </div>
    //           <DropdownButton
    //             isOpen={isOpen}
    //             toggle={() => {
    //               if (listRemainingFields.length > 0) {
    //                 setIsOpen(prevState => !prevState);
    //               }
    //             }}
    //             direction="down"
    //             style={{
    //               position: 'absolute',
    //               top: 11,
    //               right: 10,
    //             }}
    //           >
    //             <Toggle disabled={listRemainingFields.length === 0} />
    //             <MenuDropdown>
    //               {listRemainingFields.map(item => (
    //                 <DropdownItem
    //                   key={item}
    //                   onClick={() => {
    //                     dispatch({
    //                       type: 'ADD_FIELD',
    //                       item,
    //                     });
    //                   }}
    //                 >
    //                   {item}
    //                 </DropdownItem>
    //               ))}
    //             </MenuDropdown>
    //           </DropdownButton>
    //         </DragWrapper>
    //       </SettingsViewWrapper>
    //       <PopupForm
    //         headerId={getTrad('containers.ListSettingsView.modal-form.edit-label')}
    //         isOpen={isModalFormOpen}
    //         onClosed={handleClosed}
    //         onSubmit={e => {
    //           e.preventDefault();
    //           toggleModalForm();
    //           dispatch({
    //             type: 'SUBMIT_LABEL_FORM',
    //           });
    //         }}
    //         onToggle={toggleModalForm}
    //         renderForm={renderForm}
    //         subHeaderContent={labelToEdit}
    //         type={get(attributes, [labelToEdit, 'type'], 'text')}
    //       />
    //     </LayoutDndProvider>
  );
};

ListSettingsView.propTypes = {
  layout: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    settings: PropTypes.shape({
      bulkable: PropTypes.bool,
      defaultSortBy: PropTypes.string,
      defaultSortOrder: PropTypes.string,
      filterable: PropTypes.bool,
      pageSize: PropTypes.number,
      searchable: PropTypes.bool,
    }).isRequired,
    metadatas: PropTypes.object.isRequired,
    options: PropTypes.object.isRequired,
    attributes: PropTypes.objectOf(
      PropTypes.shape({
        type: PropTypes.string,
      })
    ).isRequired,
  }).isRequired,
  slug: PropTypes.string.isRequired,
};

export default memo(ListSettingsView);

// export default () => 'TODO ListSettingsView';
