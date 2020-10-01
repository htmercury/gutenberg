/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalGetBlockLabel as getBlockLabel,
	getBlockType,
} from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { last } from 'lodash';
import { Dropdown, Button } from '@wordpress/components';
import { chevronDown } from '@wordpress/icons';
import { useMemo, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TemplateDetails from '../../template-details';

function getBlockDisplayText( block ) {
	return block
		? getBlockLabel( getBlockType( block.name ), block.attributes )
		: null;
}

function useSecondaryText() {
	const {
		selectedBlock,
		getBlockParentsByBlockName,
		getBlockWithoutInnerBlocks,
	} = useSelect( ( select ) => {
		return {
			selectedBlock: select( 'core/block-editor' ).getSelectedBlock(),
			getBlockParentsByBlockName: select( 'core/block-editor' )
				.getBlockParentsByBlockName,
			getBlockWithoutInnerBlocks: select( 'core/block-editor' )
				.__unstableGetBlockWithoutInnerBlocks,
		};
	} );

	// Check if current block is a template part:
	const selectedBlockLabel =
		selectedBlock?.name === 'core/template-part'
			? getBlockDisplayText( selectedBlock )
			: null;

	if ( selectedBlockLabel ) {
		return {
			label: selectedBlockLabel,
			isActive: true,
		};
	}

	// Check if an ancestor of the current block is a template part:
	const templatePartParents = !! selectedBlock
		? getBlockParentsByBlockName(
				selectedBlock?.clientId,
				'core/template-part'
		  )
		: [];

	if ( templatePartParents.length ) {
		// templatePartParents is in order from top to bottom, so the closest
		// parent is at the end.
		const closestParent = getBlockWithoutInnerBlocks(
			last( templatePartParents )
		);
		return {
			label: getBlockDisplayText( closestParent ),
			isActive: true,
		};
	}

	return {};
}

export default function DocumentActions( { template } ) {
	const documentTitle = template?.slug;
	const { label, isActive } = useSecondaryText();

	// Title is active when there is no secondary item, or when the secondary
	// item is inactive.
	const isTitleActive = ! label?.length || ! isActive;

	// The anchor rect is used to position the dropdown relative to the overall
	// main title area, not to the chevron button. We use a memo to make sure
	// the props object reference is the same to avoid re-renders. NOTE: A
	// limitation of `anchorRect` is that it does not move when resizing.
	const titleRef = useRef( null );
	const popoverProps = useMemo(
		() =>
			titleRef.current
				? { anchorRect: titleRef.current.getBoundingClientRect() }
				: null,
		[ titleRef.current ]
	);

	return (
		<div
			className={ classnames( 'edit-site-document-actions', {
				'has-secondary-label': !! label,
			} ) }
		>
			{ documentTitle ? (
				<>
					<div
						ref={ titleRef }
						className={ classnames(
							'edit-site-document-actions__label',
							'edit-site-document-actions__title',
							{
								'is-active': isTitleActive,
							}
						) }
					>
						{ documentTitle }
						{ ! isActive && (
							<Dropdown
								popoverProps={ popoverProps }
								position="bottom center"
								renderToggle={ ( { isOpen, onToggle } ) => (
									<Button
										icon={ chevronDown }
										aria-expanded={ isOpen }
										aria-haspopup="true"
										onClick={ onToggle }
										label={ __( 'Show template details' ) }
									/>
								) }
								renderContent={ () => (
									<TemplateDetails template={ template } />
								) }
							/>
						) }
					</div>
					<div
						className={ classnames(
							'edit-site-document-actions__label',
							'edit-site-document-actions__secondary-item',
							{
								'is-active': isActive,
							}
						) }
					>
						{ label ?? '' }
					</div>
				</>
			) : (
				__( 'Loading…' )
			) }
		</div>
	);
}
