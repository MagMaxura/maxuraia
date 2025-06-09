import React, { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const RequirementInputRow = memo(({ category, item, index, handleRequirementChange, handleRemoveRequirement, formDisabledOverall }) => {
  console.log(`Rendering RequirementInputRow for category: ${category}, index: ${index}`);
  return (
    <div className="flex space-x-2 items-center">
      <Input
        type="text"
        value={category}
        onChange={(e) => handleRequirementChange(category, index, e.target.value, item)}
        placeholder="Categoría (Ej: Educación)"
        className="w-1/3"
        disabled={formDisabledOverall}
      />
      <Input
        type="text"
        value={item}
        onChange={(e) => handleRequirementChange(category, index, category, e.target.value)}
        placeholder="Cualidad (Ej: Secundaria Completa)"
        className="w-2/3"
        disabled={formDisabledOverall}
      />
      <Button
        variant="destructive"
        size="icon"
        onClick={() => handleRemoveRequirement(category, index)}
        disabled={formDisabledOverall}
      >
        -
      </Button>
    </div>
  );
});

export default RequirementInputRow;