import { css, cx } from '@emotion/css';
import Prism from 'prismjs';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { EditorField, EditorFieldGroup, EditorRow } from '@grafana/experimental';
import { useTheme2 } from '@grafana/ui';

import { lokiGrammar } from '../../syntax';

export interface Props {
  query: string;
}

export function QueryPreview({ query }: Props) {
  const theme = useTheme2();
  const styles = getStyles(theme);
  const highlighted = Prism.highlight(query, lokiGrammar, 'lokiql');

  return (
    <EditorRow>
      <EditorFieldGroup>
        <EditorField label="Raw query">
          <div
            className={cx(styles.editorField, 'prism-syntax-highlight')}
            aria-label="selector"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </EditorField>
      </EditorFieldGroup>
    </EditorRow>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    editorField: css({
      fontFamily: theme.typography.fontFamilyMonospace,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
  };
};
