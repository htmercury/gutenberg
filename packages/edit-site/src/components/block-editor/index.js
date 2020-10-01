/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useCallback,
	useState,
	useEffect,
	createPortal,
} from '@wordpress/element';
import { useEntityBlockEditor } from '@wordpress/core-data';
import {
	BlockEditorProvider,
	BlockEditorKeyboardShortcuts,
	__experimentalLinkControl,
	BlockInspector,
	WritingFlow,
	ObserveTyping,
	BlockList,
} from '@wordpress/block-editor';
import { useKeyboardShortcut } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import NavigateToLink from '../navigate-to-link';
import { SidebarInspectorFill } from '../sidebar';

export const IFrame = ( {
	children,
	head,
	styles,
	bodyClassName,
	...props
} ) => {
	const [ contentRef, setContentRef ] = useState();
	const win = contentRef && contentRef.contentWindow;
	const doc = contentRef && contentRef.contentWindow.document;

	useEffect( () => {
		if ( doc ) {
			doc.body.className = bodyClassName;
			doc.body.style.margin = '0px';
			doc.head.innerHTML = head;
			doc.dir = document.dir;

			styles.forEach( ( { css } ) => {
				const styleEl = doc.createElement( 'style' );
				styleEl.innerHTML = css;
				doc.head.appendChild( styleEl );
			} );

			[ ...document.styleSheets ].reduce( ( acc, styleSheet ) => {
				try {
					const isMatch = [ ...styleSheet.cssRules ].find(
						( { selectorText } ) => {
							return (
								selectorText.indexOf(
									'.editor-styles-wrapper'
								) !== -1
							);
						}
					);

					if ( isMatch ) {
						const node = styleSheet.ownerNode;

						if ( ! doc.getElementById( node.id ) ) {
							doc.head.appendChild( node );
						}
					}
				} catch ( e ) {}

				return acc;
			}, [] );
		}
	}, [ doc ] );

	return (
		<iframe
			{ ...props }
			ref={ setContentRef }
			title={ __( 'Editor content' ) }
			name="editor-content"
		>
			<useKeyboardShortcut.WindowContext.Provider value={ win }>
				{ doc && createPortal( children, doc.body ) }
			</useKeyboardShortcut.WindowContext.Provider>
		</iframe>
	);
};

export default function BlockEditor( { setIsInserterOpen } ) {
	const { settings, templateType, page } = useSelect(
		( select ) => {
			const { getSettings, getTemplateType, getPage } = select(
				'core/edit-site'
			);
			return {
				settings: getSettings( setIsInserterOpen ),
				templateType: getTemplateType(),
				page: getPage(),
			};
		},
		[ setIsInserterOpen ]
	);
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		templateType
	);

	const { setPage } = useDispatch( 'core/edit-site' );
	return (
		<BlockEditorProvider
			settings={ settings }
			value={ blocks }
			onInput={ onInput }
			onChange={ onChange }
			useSubRegistry={ false }
		>
			<BlockEditorKeyboardShortcuts />
			<__experimentalLinkControl.ViewerFill>
				{ useCallback(
					( fillProps ) => (
						<NavigateToLink
							{ ...fillProps }
							activePage={ page }
							onActivePageChange={ setPage }
						/>
					),
					[ page ]
				) }
			</__experimentalLinkControl.ViewerFill>
			<SidebarInspectorFill>
				<BlockInspector />
			</SidebarInspectorFill>
			<IFrame
				className="edit-post-visual-editor"
				style={ [] }
				head={ window.__editorStyles.html }
				styles={ settings.styles }
				bodyClassName="editor-styles-wrapper edit-site-block-editor__editor-styles-wrapper"
			>
				<WritingFlow>
					<ObserveTyping>
						<BlockList className="edit-site-block-editor__block-list" />
					</ObserveTyping>
				</WritingFlow>
			</IFrame>
		</BlockEditorProvider>
	);
}
